import os
import time
import uuid
import logging
from datetime import datetime, timezone
import asyncio
from fastapi import FastAPI, BackgroundTasks, Request, HTTPException
from pydantic import BaseModel
import asyncpg
import hvac
from playwright.async_api import async_playwright

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Cookie Scanner Service")
pool: asyncpg.Pool = None

# Connect to Vault for secrets
def get_pg_url():
    vault_addr = os.getenv("VAULT_ADDR", "http://localhost:8200")
    vault_token = os.getenv("VAULT_TOKEN", "root")
    secret_path = os.getenv("VAULT_SECRET_PATH", "secret/data/arc/cookie-scanner")
    
    try:
        client = hvac.Client(url=vault_addr, token=vault_token)
        mount_point = "secret"
        path = secret_path.replace("secret/data/", "")
        
        response = client.secrets.kv.v2.read_secret_version(path=path, mount_point=mount_point)
        data = response['data']['data']
        url = data.get("PG_URL")
        if not url:
            raise Exception("PG_URL missing in Vault")
        return url
    except Exception as e:
        logger.error(f"Failed to fetch secrets from vault: {e}")
        # fallback locally for dev testing if missing
        return os.getenv("PG_URL", "postgres://postgres:postgres@postgres:5432/arc_db?sslmode=disable")

@app.on_event("startup")
async def startup():
    global pool
    pg_url = get_pg_url()
    try:
        pool = await asyncpg.create_pool(dsn=pg_url, min_size=2, max_size=10)
        logger.info("Connected to PostgreSQL successfully")
    except Exception as e:
        logger.fatal(f"Failed to connect to postgres: {e}")

@app.on_event("shutdown")
async def shutdown():
    if pool:
        await pool.close()

def categorize_cookie(name: str) -> str:
    n = name.lower()
    for s in ['_ga', '_gid', '_gat', 'utma', 'utmb', 'utmc', 'utmz', '_hjid', '_hjsession', '_hjincluded']:
        if s in n: return "Analytics"
    for s in ['fbp', '_fbc', 'ide', 'test_cookie', 'muid', 'anonchk', '_ttp', 'fr_']:
        if s in n: return "Marketing"
    for s in ['lang', 'locale', 'language', 'seen_cookie', 'cookie_notice', 'cookie_consent', 'gdpr']:
        if s in n: return "Functional"
    for s in ['session', 'csrf', 'xsrf', 'jsessionid', 'phpsessid', 'asp.net_', 'cf_clearance', '__cfduid', 'token', 'auth']:
        if s in n: return "Necessary"
    return "Unknown"

async def scan_worker(scan_id: str, target_url: str):
    logger.info(f"Starting async background scan for {scan_id} -> {target_url}")
    
    start_time = datetime.now(timezone.utc)
    
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE cookie_scans 
            SET status = 'running', started_at = $2, updated_at = $2
            WHERE id = $1
        """, scan_id, start_time)
        
    extracted_cookies = []
    scan_error = None
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                ]
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={'width': 1920, 'height': 1080},
                device_scale_factor=1,
            )
            page = await context.new_page()
            
            try:
                # 60s timeout for initial DOM load
                await page.goto(target_url, wait_until="domcontentloaded", timeout=60000)
                
                # Human simulation
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await asyncio.sleep(3)
                await page.evaluate("window.scrollTo(0, 0)")
                
                try:
                    await page.wait_for_load_state("networkidle", timeout=8000)
                except Exception:
                    logger.warning(f"Network idle timeout on {target_url} - proceeding anyway")
                    pass
                
                # Final wait for trailing scripts
                await asyncio.sleep(4)
                
            except Exception as e:
                logger.warning(f"Navigation/timeout issue on {target_url}: {e}")
                scan_error = str(e)

            raw_cookies = await context.cookies()
            await browser.close()
            
            # Map down Playwright cookies to DB row definitions
            for c in raw_cookies:
                exp = None
                if c.get('expires', -1) > 0:
                    exp = datetime.fromtimestamp(c['expires'], timezone.utc)
                    
                extracted_cookies.append({
                    'id': str(uuid.uuid4()),
                    'scan_id': scan_id,
                    'name': c.get('name', ''),
                    'domain': c.get('domain', ''),
                    'path': c.get('path', '/'),
                    'value': c.get('value', ''),
                    'expiration': exp,
                    'secure': bool(c.get('secure')),
                    'http_only': bool(c.get('httpOnly')),
                    'same_site': str(c.get('sameSite', '')),
                    'source': 'headless_browser',
                    'category': categorize_cookie(c.get('name', '')),
                    'description': 'Automatically detected via PII Discovery',
                })
                
    except Exception as outer_e:
        logger.error(f"Playwright critical error on {target_url}: {outer_e}")
        scan_error = str(outer_e)

    # ────────────────────────────────────────────────────────
    # Persist the output safely
    # ────────────────────────────────────────────────────────
    now = datetime.now(timezone.utc)
    final_status = 'failed' if scan_error else 'completed'

    logger.info(f"Scan {scan_id} {final_status} with {len(extracted_cookies)} cookies. Insertions pending.")

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute("""
                UPDATE cookie_scans 
                SET status = $2, error = $3, completed_at = $4, updated_at = $4
                WHERE id = $1
            """, scan_id, final_status, scan_error, now)
            
            if extracted_cookies:
                await conn.copy_records_to_table(
                    'scanned_cookies',
                    columns=[
                        'id', 'scan_id', 'name', 'domain', 'path', 'value',
                        'expiration', 'secure', 'http_only', 'same_site',
                        'source', 'category', 'description'
                    ],
                    records=[
                         (c['id'], c['scan_id'], c['name'], c['domain'], c['path'], c['value'],
                          c['expiration'], c['secure'], c['http_only'], c['same_site'],
                          c['source'], c['category'], c['description'])
                         for c in extracted_cookies
                    ]
                )

# ── API ENDPOINTS ────────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    url: str

def get_tenant_from_req(req: Request) -> str:
    tid = req.headers.get("X-Internal-Org-Id", "")
    if not tid:
        tid = "00000000-0000-0000-0000-000000000000"
    return tid

@app.post("/scans")
async def create_scan(req: Request, data: ScanRequest, bg_tasks: BackgroundTasks):
    tid = get_tenant_from_req(req)
    scan_id = str(uuid.uuid4())
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO cookie_scans (id, tenant_id, url, status, created_at, updated_at)
            VALUES ($1, $2, $3, 'pending', NOW(), NOW())
            RETURNING *
        """, scan_id, tid, data.url)
        
    bg_tasks.add_task(scan_worker, scan_id, data.url)
    return dict(row)

@app.get("/scans")
async def list_scans(req: Request):
    tid = get_tenant_from_req(req)
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM cookie_scans 
            WHERE tenant_id = $1 
            ORDER BY created_at DESC 
            LIMIT 50 OFFSET 0
        """, tid)
    return [dict(r) for r in rows]

@app.get("/scans/{id}")
async def get_scan(id: str):
    async with pool.acquire() as conn:
        scan = await conn.fetchrow("SELECT * FROM cookie_scans WHERE id = $1", id)
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        cookies = await conn.fetch("""
            SELECT * FROM scanned_cookies 
            WHERE scan_id = $1 
            ORDER BY category, name
        """, id)
        
    return {
        "scan": dict(scan),
        "cookies": [dict(c) for c in cookies]
    }
