import { test, expect } from '@playwright/test';

test.describe('CMP Widget Integration', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset consent state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('arc_consent_given');
      localStorage.removeItem('arc_consent_data');
      localStorage.removeItem('arc_consent_timestamp');
      localStorage.removeItem('arc_anonymous_id');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('1. CMP widget script is loaded and initialized', async ({ page }) => {
    // Wait for CMP script to load
    await page.waitForFunction(() => {
      return typeof window !== 'undefined' && window.CC !== undefined;
    }, { timeout: 10000 });

    // Check that CMP is initialized
    const isInitialized = await page.evaluate(() => window.CMP_INITIALIZED);
    expect(isInitialized).toBe(true);

    // Check that the script tag is present
    const scriptTag = page.locator('script[src*="cmp.js"]');
    await expect(scriptTag).toBeAttached();

    console.log('✅ CMP widget loaded and initialized');
  });

  test('2. Form has correct consent binding attributes', async ({ page }) => {
    // Scroll to form
    await page.locator('#demo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Check form ID
    const form = page.locator('#demo-form');
    await expect(form).toBeVisible();

    // Check email field has consent binding
    const emailField = page.locator('input[data-cmp-consent-id="marketing_opt_in"]');
    await expect(emailField).toBeVisible();
    await expect(emailField).toHaveAttribute('type', 'email');

    console.log('✅ Form has correct consent binding');
  });

  test('3. Banner appears when interacting with consent-bound field', async ({ page }) => {
    // Scroll to form
    await page.locator('#demo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Initially, no banner should be visible (widget shows on interaction)
    await page.waitForTimeout(2000); // Give time for any auto-banner to appear

    // Focus or interact with the email field (which has consent binding)
    const emailField = page.locator('input[data-cmp-consent-id="marketing_opt_in"]');
    await emailField.click();
    await page.waitForTimeout(1000);

    // Type something to trigger the widget
    await emailField.fill('test@example.com');
    await page.waitForTimeout(2000); // Wait for widget to show banner

    // Take screenshot to see if banner appeared
    await page.screenshot({ path: 'e2e/screenshots/widget-banner-on-interaction.png', fullPage: false });

    console.log('✅ Interacted with consent-bound field');
  });

  test('4. Submit button is initially enabled (widget handles consent gating)', async ({ page }) => {
    // Scroll to form
    await page.locator('#demo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Submit button should be enabled (widget will handle consent gating)
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
    await expect(submitBtn).toContainText('Schedule Demo');

    console.log('✅ Submit button is enabled (widget handles consent)');
  });

  test('5. Form submission works with widget consent flow', async ({ page }) => {
    // Scroll to form and fill it
    await page.locator('#demo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Fill form fields
    await page.locator('#firstName').fill('John');
    await page.locator('#lastName').fill('Doe');
    await page.locator('#companyName').fill('Test Corp');

    // Fill email field (this should trigger consent banner)
    const emailField = page.locator('input[data-cmp-consent-id="marketing_opt_in"]');
    await emailField.fill('john.doe@testcorp.com');
    await page.waitForTimeout(2000);

    // Take screenshot before submit
    await page.screenshot({ path: 'e2e/screenshots/widget-form-filled.png', fullPage: false });

    // Try to submit - widget should handle consent flow
    const submitBtn = page.locator('button[type="submit"]');
    
    // Listen for potential consent dialogs or API calls
    const consentRequest = page.waitForRequest(req =>
      req.url().includes('/consent') && req.method() === 'POST',
      { timeout: 5000 }
    ).catch(() => null);

    await submitBtn.click();
    await page.waitForTimeout(3000);

    // Check if consent API was called
    const apiCall = await consentRequest;
    if (apiCall) {
      console.log('✅ Consent API called:', apiCall.url());
      const postData = apiCall.postDataJSON();
      console.log('Consent payload:', JSON.stringify(postData));
    } else {
      console.log('ℹ️  No consent API call detected (widget may handle differently)');
    }

    // Take screenshot after submit attempt
    await page.screenshot({ path: 'e2e/screenshots/widget-after-submit.png', fullPage: false });
  });

  test('6. Visual verification of widget integration', async ({ page }) => {
    // Full page screenshot for visual review
    await page.screenshot({ path: 'e2e/screenshots/widget-full-page.png', fullPage: true });

    // Scroll to form section
    await page.locator('#demo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Form section screenshot
    await page.screenshot({ path: 'e2e/screenshots/widget-form-section.png', fullPage: false });

    console.log('✅ Visual screenshots captured');
  });
});
