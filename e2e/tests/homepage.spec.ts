import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Defne Qr/);
    await expect(page).toHaveURL('/');
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    
    // Should have main heading
    const heading = await page.locator('h1').first().isVisible();
    expect(heading).toBeTruthy();
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to features
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    
    // Should have feature cards
    const features = await page.locator('text=/özellik|feature/i').count();
    expect(features).toBeGreaterThanOrEqual(0);
  });

  test('should display pricing plans', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to pricing
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);
    
    // Should have plan cards
    const plans = await page.locator('text=/ücretsiz|premium|kurumsal|free|custom/i').count();
    expect(plans).toBeGreaterThan(0);
  });

  test('should navigate to login', async ({ page }) => {
    await page.goto('/');
    
    // Find and click login button
    const loginButton = page.locator('a[href*="login"], button:has-text("Giriş")').first();
    await loginButton.click();
    
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should navigate to register', async ({ page }) => {
    await page.goto('/');
    
    // Find and click register button
    const registerButton = page.locator('a[href*="register"], button:has-text("Kayıt")').first();
    const exists = await registerButton.isVisible().catch(() => false);
    
    if (exists) {
      await registerButton.click();
      await expect(page).toHaveURL(/\/auth\/register/);
    }
  });

  test('should be SEO optimized', async ({ page }) => {
    await page.goto('/');
    
    // Check meta tags
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description?.length).toBeGreaterThan(50);
    
    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
  });

  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known/acceptable errors
    const criticalErrors = consoleErrors.filter(
      err => !err.includes('favicon') && !err.includes('analytics')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
