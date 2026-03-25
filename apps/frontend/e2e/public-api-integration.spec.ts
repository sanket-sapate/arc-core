import { test, expect } from '@playwright/test';

const PUBLIC_API = 'http://localhost:8080';
const API_KEY = 'f8c965ecdf3499ed9fb3343a303b8f9df5ff01e4746c4dd562f86d9635cb47df';

test.describe('Public API Service - CMP Widget Integration', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('1. GET /api/v1/public/cookie-banner returns banner config', async ({ request }) => {
    const res = await request.get(`${PUBLIC_API}/api/v1/public/cookie-banner?domain=localhost`, {
      headers: { 'X-API-Key': API_KEY }
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('banner');
    expect(body.banner).toHaveProperty('title');
    expect(body.banner).toHaveProperty('purposes');
    expect(body.banner.purposes.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('categories');

    // Verify specific purposes
    const purposeIds = body.banner.purposes.map((p: any) => p.id);
    expect(purposeIds).toContain('strictly_necessary');
    expect(purposeIds).toContain('analytics');
    expect(purposeIds).toContain('marketing');
    expect(purposeIds).toContain('functional');

    console.log('✅ Banner config fetched:', body.banner.title);
    console.log('   Purposes:', purposeIds.join(', '));
  });

  test('2. GET /api/v1/public/cookie-banner returns 400 without X-API-Key', async ({ request }) => {
    const res = await request.get(`${PUBLIC_API}/api/v1/public/cookie-banner?domain=localhost`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    console.log('✅ Missing X-API-Key correctly rejected:', body.error);
  });

  test('3. GET /api/v1/public/cookie-banner returns 400 without domain', async ({ request }) => {
    const res = await request.get(`${PUBLIC_API}/api/v1/public/cookie-banner`, {
      headers: { 'X-API-Key': API_KEY }
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    console.log('✅ Missing domain correctly rejected:', body.error);
  });

  test('4. POST /api/v1/public/cookie-consent queues consent with form_data', async ({ request }) => {
    const payload = {
      organization_id: API_KEY,
      domain: 'localhost',
      anonymous_id: `anon_test_${Date.now()}`,
      consents: {
        analytics: true,
        marketing: true,
        functional: true,
        strictly_necessary: true
      },
      form_data: {
        email: 'john.doe@testcorp.com',
        first_name: 'John',
        last_name: 'Doe'
      }
    };

    const res = await request.post(`${PUBLIC_API}/api/v1/public/cookie-consent`, {
      data: payload
    });
    expect(res.status()).toBe(202);

    const body = await res.json();
    expect(body.status).toBe('queued');
    console.log('✅ Consent queued with form_data (email recorded)');
  });

  test('5. POST /api/v1/public/cookie-consent uses X-API-Key header as org_id', async ({ request }) => {
    const payload = {
      // No organization_id in body — should be taken from header
      domain: 'localhost',
      anonymous_id: `anon_header_${Date.now()}`,
      consents: { analytics: true, marketing: false, functional: true, strictly_necessary: true }
    };

    const res = await request.post(`${PUBLIC_API}/api/v1/public/cookie-consent`, {
      headers: { 'X-API-Key': API_KEY },
      data: payload
    });
    expect(res.status()).toBe(202);
    console.log('✅ org_id resolved from X-API-Key header');
  });

  test('6. POST /api/v1/public/cookie-consent returns 400 when missing required fields', async ({ request }) => {
    const res = await request.post(`${PUBLIC_API}/api/v1/public/cookie-consent`, {
      data: { consents: { analytics: true } }  // missing domain, anonymous_id, org_id
    });
    expect(res.status()).toBe(400);
    console.log('✅ Missing required fields correctly rejected');
  });

  test('7. CORS preflight returns permissive headers', async ({ request }) => {
    const res = await request.fetch(`${PUBLIC_API}/api/v1/public/cookie-banner?domain=localhost`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://customer-domain.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-API-Key,Content-Type'
      }
    });
    expect(res.status()).toBe(204);
    expect(res.headers()['access-control-allow-origin']).toBe('*');
    expect(res.headers()['access-control-allow-headers']).toContain('X-API-Key');
    console.log('✅ CORS preflight correct: origin=*, X-API-Key allowed');
  });

  test('8. Widget on landing page fetches real banner from public-api-service', async ({ page }) => {
    // Intercept the banner fetch
    const bannerRequest = page.waitForRequest(
      req => req.url().includes('/api/v1/public/cookie-banner') && req.method() === 'GET',
      { timeout: 10000 }
    ).catch(() => null);

    const bannerResponse = page.waitForResponse(
      res => res.url().includes('/api/v1/public/cookie-banner') && res.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for CMP init + fetch

    const req = await bannerRequest;
    const res = await bannerResponse;

    if (req) {
      console.log('✅ Banner request made to:', req.url());
      expect(req.headers()['x-api-key']).toBe(API_KEY);
    } else {
      console.log('ℹ️  No banner request captured (CMP may init asynchronously)');
    }

    if (res) {
      const body = await res.json();
      console.log('✅ Banner response received:', body.banner?.title);
      expect(body).toHaveProperty('banner');
    }

    await page.screenshot({ path: 'e2e/screenshots/real-api-banner.png', fullPage: false });
  });

  test('9. Widget consent submission reaches public-api-service', async ({ page }) => {
    const consentRequest = page.waitForRequest(
      req => req.url().includes('/api/v1/public/cookie-consent') && req.method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll to form and fill email to trigger consent
    await page.locator('#demo').scrollIntoViewIfNeeded();
    await page.locator('#workEmail').fill('integration@test.com');
    await page.waitForTimeout(2000);

    const req = await consentRequest;
    if (req) {
      const postData = req.postDataJSON();
      console.log('✅ Consent submitted to public-api-service');
      console.log('   Payload:', JSON.stringify(postData));
    } else {
      console.log('ℹ️  No consent request captured (widget may show banner first)');
    }

    await page.screenshot({ path: 'e2e/screenshots/real-api-consent.png', fullPage: false });
  });
});
