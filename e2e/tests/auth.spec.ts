import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/Defne Qr/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('button[type="submit"]');
    
    // Wait for validation errors
    await page.waitForTimeout(500);
    const errors = await page.locator('.text-red-500, .text-red-600').count();
    expect(errors).toBeGreaterThan(0);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(1000);
    const errorVisible = await page.locator('text=/hata|error|geçersiz/i').isVisible().catch(() => false);
    expect(errorVisible).toBeTruthy();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('text=/kayıt|register/i');
    
    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.locator('input[name="fullName"], input[name="email"]')).toBeVisible();
  });

  test('should show validation errors on registration', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    const errors = await page.locator('.text-red-500, .text-red-600').count();
    expect(errors).toBeGreaterThan(0);
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/auth/register');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[name="fullName"], input[placeholder*="Ad"]', 'Test User');
    await page.fill('input[type="password"]', '123'); // Weak password
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    // Should show password strength error
    const passwordError = await page.locator('text=/şifre|password/i').isVisible().catch(() => false);
    expect(passwordError).toBeTruthy();
  });
});
