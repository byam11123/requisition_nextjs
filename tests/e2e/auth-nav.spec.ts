import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show dashboard after login', async ({ page }) => {
    // Note: This assumes a demo account exists or is mocked in the dev server
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Check if dashboard title is visible
    await expect(page.locator('h1')).toContainText('Dashboard Overview');
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test in this block
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('can navigate to requisitions', async ({ page }) => {
    await page.click('a[href*="requisition"]');
    await expect(page.locator('h1')).toContainText('Requisitions');
  });

  test('can navigate to store management', async ({ page }) => {
    await page.click('a[href*="store"]');
    await expect(page.locator('h1')).toContainText('Store Inventory');
  });
});
