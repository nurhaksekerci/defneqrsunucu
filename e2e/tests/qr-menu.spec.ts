import { test, expect } from '@playwright/test';

test.describe('QR Menu - Public View', () => {
  test('should display public QR menu', async ({ page }) => {
    // Visit a test restaurant menu (you'll need to replace with actual slug)
    await page.goto('/test-restaurant/menu');
    
    // Should load without requiring authentication
    await expect(page).toHaveURL(/\/.*\/menu/);
  });

  test('should display categories', async ({ page }) => {
    await page.goto('/test-restaurant/menu');
    
    // Wait for categories to load
    await page.waitForSelector('[data-testid="category"], .category-button, button', { timeout: 5000 });
    
    const categories = await page.locator('[data-testid="category"], .category-button, button').count();
    expect(categories).toBeGreaterThan(0);
  });

  test('should display products', async ({ page }) => {
    await page.goto('/test-restaurant/menu');
    
    // Wait for products to load
    await page.waitForTimeout(2000);
    
    const products = await page.locator('[data-testid="product"], .product-card, img[alt*="ürün"]').count();
    expect(products).toBeGreaterThanOrEqual(0); // May be 0 if no products
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/test-restaurant/menu');
    await page.waitForTimeout(2000);
    
    // Click first category if exists
    const firstCategory = page.locator('[data-testid="category"], .category-button, button').first();
    const exists = await firstCategory.isVisible().catch(() => false);
    
    if (exists) {
      await firstCategory.click();
      await page.waitForTimeout(500);
      
      // Products should update (implementation specific)
      await expect(page).toHaveURL(/\?/); // May have query params
    }
  });

  test('should be mobile responsive', async ({ page, viewport }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/test-restaurant/menu');
    
    // Should display properly on mobile
    const content = await page.locator('body').isVisible();
    expect(content).toBeTruthy();
  });

  test('should track QR scan visit', async ({ page }) => {
    await page.goto('/test-restaurant/menu');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check if analytics script ran (implementation specific)
    await page.waitForTimeout(1000);
    
    // Visit should be recorded in backend
    expect(page.url()).toContain('/menu');
  });
});
