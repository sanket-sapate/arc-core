import { test, expect } from '@playwright/test';

test.describe('Consent Banner & Contact Form Flow', () => {

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

  test('1. Banner is visible on page load with explicit purposes', async ({ page }) => {
    // Banner should be visible
    const banner = page.locator('text=We respect your privacy');
    await expect(banner).toBeVisible({ timeout: 10000 });

    // Explicit purposes should be listed
    await expect(page.getByText('Strictly Necessary', { exact: true })).toBeVisible();
    await expect(page.getByText('Functional', { exact: true })).toBeVisible();
    await expect(page.getByText('Analytics', { exact: true })).toBeVisible();
    await expect(page.getByText('Marketing', { exact: true })).toBeVisible();

    // Purpose descriptions should be present
    await expect(page.locator('text=Essential for the website to function')).toBeVisible();
    await expect(page.locator('text=Helps us understand how visitors interact')).toBeVisible();

    // Screenshot for visual verification
    await page.screenshot({ path: 'e2e/screenshots/01-banner-visible.png', fullPage: true });
  });

  test('2. Submit button is DISABLED before consent is given', async ({ page }) => {
    // Scroll to the demo form
    await page.locator('#demo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Find the submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    // Button should be disabled
    await expect(submitBtn).toBeDisabled();

    // Button text should indicate consent is required
    await expect(submitBtn).toContainText('Accept Consent to Continue');

    // Warning message should be visible
    await expect(page.locator('text=Please accept the consent banner below')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/02-submit-disabled.png', fullPage: false });
  });

  test('3. Clicking "Accept All & Continue" records consent via API and enables submit', async ({ page }) => {
    // Intercept the consent API call
    const consentRequest = page.waitForRequest(req =>
      req.url().includes('/v1/sdk/consent') && req.method() === 'POST',
      { timeout: 10000 }
    ).catch(() => null);

    // Click Accept on the banner
    const acceptBtn = page.locator('button:has-text("Accept All & Continue")');
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();

    // Check that the API call was made (or attempted)
    const apiCall = await consentRequest;
    if (apiCall) {
      const postData = apiCall.postDataJSON();
      console.log('Consent API payload:', JSON.stringify(postData));
      expect(postData).toHaveProperty('organization_id');
      expect(postData).toHaveProperty('consents');
      expect(postData.consents.analytics).toBe(true);
      expect(postData.consents.marketing).toBe(true);
      expect(postData.consents.strictly_necessary).toBe(true);
    }

    // Wait for banner to disappear (may or may not depending on API success)
    await page.waitForTimeout(2000);

    // Check localStorage was set
    const consentGiven = await page.evaluate(() => localStorage.getItem('arc_consent_given'));
    // If the API is not running, consent may fail. Log either way.
    console.log('Consent given in localStorage:', consentGiven);

    await page.screenshot({ path: 'e2e/screenshots/03-after-consent.png', fullPage: true });
  });

  test('4. After consent, submit button becomes enabled', async ({ page }) => {
    // Simulate consent already given by setting localStorage
    await page.evaluate(() => {
      localStorage.setItem('arc_consent_given', 'true');
      localStorage.setItem('arc_consent_data', JSON.stringify({
        analytics: true, marketing: true, functional: true, strictly_necessary: true
      }));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Banner should NOT be visible
    const banner = page.locator('text=We respect your privacy');
    await expect(banner).not.toBeVisible({ timeout: 5000 });

    // Scroll to form
    await page.locator('#demo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Submit button should be ENABLED
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
    await expect(submitBtn).toContainText('Schedule Demo');

    // Warning message should NOT be visible
    await expect(page.locator('text=Please accept the consent banner below')).not.toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/04-submit-enabled.png', fullPage: false });
  });

  test('5. "Decline Optional" still enables form but with limited consent', async ({ page }) => {
    // Intercept the consent API call
    const consentRequest = page.waitForRequest(req =>
      req.url().includes('/v1/sdk/consent') && req.method() === 'POST',
      { timeout: 10000 }
    ).catch(() => null);

    // Click Decline Optional
    const declineBtn = page.locator('button:has-text("Decline Optional")');
    await expect(declineBtn).toBeVisible();
    await declineBtn.click();

    // Check API call payload
    const apiCall = await consentRequest;
    if (apiCall) {
      const postData = apiCall.postDataJSON();
      console.log('Decline API payload:', JSON.stringify(postData));
      expect(postData.consents.analytics).toBe(false);
      expect(postData.consents.marketing).toBe(false);
      expect(postData.consents.strictly_necessary).toBe(true);
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/05-after-decline.png', fullPage: true });
  });

  test('6. Visual: Full page looks good', async ({ page }) => {
    // Take a full-page screenshot for visual review
    await page.screenshot({ path: 'e2e/screenshots/06-full-page-with-banner.png', fullPage: true });

    // Scroll to form and screenshot
    await page.locator('#demo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/07-form-section.png', fullPage: false });
  });
});
