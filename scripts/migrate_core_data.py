import os
import sys
import json
import psycopg2
from psycopg2.extras import DictCursor, execute_batch, Json
from dotenv import load_dotenv

def get_connection(env_var_name):
    url = os.environ.get(env_var_name)
    if not url:
        print(f"Error: Environment variable {env_var_name} is missing.")
        sys.exit(1)
    try:
        return psycopg2.connect(url)
    except Exception as e:
        print(f"Failed to connect to {env_var_name}: {e}")
        sys.exit(1)

def load_legacy_data():
    try:
        with open('scripts/legacy_data.json', 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Failed to load legacy_data.json: {e}")
        sys.exit(1)

def main():
    load_dotenv()
    print("Initializing Database Connections & Loading Legacy Data...")
    
    # Use local JSON for legacy data
    legacy_data = load_legacy_data()
    
    # Target microservices connections
    iam_conn = get_connection("IAM_DB_URL")
    disc_conn = get_connection("DISCOVERY_DB_URL")
    trm_conn = get_connection("TRM_DB_URL")
    priv_conn = get_connection("PRIVACY_DB_URL")

    iam_cur = iam_conn.cursor()
    disc_cur = disc_conn.cursor()
    trm_cur = trm_conn.cursor()
    priv_cur = priv_conn.cursor()

    try:
        # ---------------------------------------------------------
        # Phase 1: Organizations (iam-service)
        # ---------------------------------------------------------
        print("\n--- Phase 1: Organizations ---")
        tenants = legacy_data.get('tenants', [])
        print(f"Loaded {len(tenants)} tenants from local data.")

        execute_batch(iam_cur,
            """
            INSERT INTO organizations (id, name, created_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            [(t['id'], t['name'], t['created_at']) for t in tenants]
        )
        iam_conn.commit()
        print(f"Loaded {len(tenants)} organizations into iam-service.")

        default_org_id = tenants[0]['id'] if tenants else None
        if not default_org_id:
            print("Warning: No tenants found. Downstream missing org IDs will fail.")

        # ---------------------------------------------------------
        # Phase 2: TPRM & Discovery (trm-service, discovery-service)
        # ---------------------------------------------------------
        print("\n--- Phase 2: Data Intelligence & TPRM ---")
        
        # Discovery-Service: Data Dictionary
        data_dicts = legacy_data.get('data_dictionary', [])
        print(f"Loaded {len(data_dicts)} data dictionary items.")
        
        execute_batch(disc_cur,
            """
            INSERT INTO data_dictionary (id, organization_id, name, category, sensitivity, active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            [(d['id'], default_org_id, d['name'], d['category'], d['sensitivity'], d['active'], d['created_at'], d['updated_at']) for d in data_dicts]
        )
        disc_conn.commit()
        print(f"Loaded {len(data_dicts)} data dictionary items into discovery-service.")

        # TRM-Service: Frameworks
        frameworks = legacy_data.get('frameworks', [])
        print(f"Loaded {len(frameworks)} frameworks.")
        execute_batch(trm_cur,
            """
            INSERT INTO frameworks (id, organization_id, name, version, description, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            [(f['id'], default_org_id, f['name'], f['version'], f['description'], f['created_at'], f['updated_at']) for f in frameworks]
        )

        # TRM-Service: Audit Cycles
        audit_cycles = legacy_data.get('audit_cycles', [])
        print(f"Loaded {len(audit_cycles)} audit cycles.")
        execute_batch(trm_cur,
            """
            INSERT INTO audit_cycles (id, organization_id, name, status, start_date, end_date, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            [(ac['id'], default_org_id, ac['name'], ac['status'], ac.get('start_date'), ac.get('end_date'), ac['created_at'], ac['updated_at']) for ac in audit_cycles]
        )

        # TRM-Service: Vendors
        vendors = legacy_data.get('vendors', [])
        print(f"Loaded {len(vendors)} vendors.")
        
        execute_batch(trm_cur,
            """
            INSERT INTO vendors (id, organization_id, name, contact_email, compliance_status, risk_level, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            [(v['id'], v.get('tenant_id') or default_org_id, v['name'], v['contact_email'], v.get('compliance_status'), v['risk_level'], v['created_at'], v['updated_at']) for v in vendors]
        )

        # TRM-Service: Assessments
        assessments = legacy_data.get('assessments', [])
        print(f"Loaded {len(assessments)} assessments.")
        
        execute_batch(trm_cur,
            """
            INSERT INTO assessments (id, organization_id, vendor_id, framework_id, status, score, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            [(a['id'], default_org_id, a['vendor_id'], a['framework_id'], a['status'], a.get('score'), a['created_at'], a['updated_at']) for a in assessments]
        )
        trm_conn.commit()
        print(f"Loaded frameworks, audit cycles, vendors and {len(assessments)} assessments into trm-service.")

        # ---------------------------------------------------------
        # Phase 3: Privacy & Consent (privacy-service)
        # ---------------------------------------------------------
        print("\n--- Phase 3: Privacy & Consent ---")
        
        # Cookie Banners
        banners = legacy_data.get('cookie_banners', [])
        print(f"Loaded {len(banners)} cookie banners.")
        execute_batch(priv_cur,
            """
            INSERT INTO cookie_banners (id, organization_id, domain, name, title, message, accept_button_text, reject_button_text, settings_button_text, theme, position, active, config, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            [(b['id'], b.get('organization_id', default_org_id), b.get('domain'), b.get('name'), b['title'], b['message'], b['accept_button_text'], b['reject_button_text'], b['settings_button_text'], b['theme'], b['position'], b['active'], Json(b['config']), b['created_at'], b['updated_at']) for b in banners]
        )

        # Privacy Requests
        requests = legacy_data.get('privacy_requests', [])
        print(f"Loaded {len(requests)} privacy requests.")
        if requests:
            execute_batch(priv_cur,
                """
                INSERT INTO privacy_requests (id, organization_id, type, status, requester_email, requester_name, description, resolution, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
                """,
                [(pr['id'], default_org_id, pr['type'], pr['status'], pr['requester_email'], pr['requester_name'], pr['description'], pr['resolution'], pr['created_at'], pr['updated_at']) for pr in requests]
            )

        # Grievances
        grievances = legacy_data.get('grievances', [])
        print(f"Loaded {len(grievances)} grievances.")
        if grievances:
            execute_batch(priv_cur,
                """
                INSERT INTO grievances (id, organization_id, user_id, reporter_email, issue_type, description, status, priority, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
                """,
                [(g['id'], g.get('tenant_id') or default_org_id, g['user_id'], None, g.get('grievance_type') or g.get('subject') or 'General', g['description'], g['status'], g['priority'], g['created_at'], g['updated_at']) for g in grievances]
            )

        # Consent Receipts
        receipts = legacy_data.get('cookie_consents', [])
        print(f"Loaded {len(receipts)} consent receipts.")
        if receipts:
            execute_batch(priv_cur,
                """
                INSERT INTO consent_receipts (id, organization_id, user_id, domain, anonymous_id, consents, ip_address, user_agent, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
                """,
                [(c['id'], default_org_id, c['user_id'], c['domain'], c.get('anonymous_id') or str(c['user_id']), Json(c['consents']), c['ip_address'], c['user_agent'], c['created_at']) for c in receipts]
            )

        priv_conn.commit()
        print(f"Loaded privacy & consent items into privacy-service.")

        print("\nMigration Completed Successfully.")

    except Exception as e:
        print(f"An error occurred during migration: {e}")
        iam_conn.rollback()
        disc_conn.rollback()
        trm_conn.rollback()
        priv_conn.rollback()
        sys.exit(1)
    finally:
        iam_cur.close()
        disc_cur.close()
        trm_cur.close()
        priv_cur.close()

        iam_conn.close()
        disc_conn.close()
        trm_conn.close()
        priv_conn.close()

if __name__ == "__main__":
    main()

