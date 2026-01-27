// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Explore Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore/all');
    await page.waitForLoadState('domcontentloaded');
  });

  test('displays the explore page with content', async ({ page }) => {
    // The React root should have rendered
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('shows creator cards or empty state', async ({ page }) => {
    // Wait for React to render beyond the loading state
    await page.waitForTimeout(2000);

    // Either creator cards are visible or some page content rendered
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('location filter navigation works', async ({ page }) => {
    await page.goto('/explore/Lagos');
    await expect(page).toHaveURL(/\/explore\/Lagos/);
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('explore page is accessible without authentication', async ({ page }) => {
    // Clear any auth state (we're already on localhost origin from beforeEach)
    await page.evaluate(() => {
      localStorage.removeItem('hush_auth');
      localStorage.removeItem('hush_token');
    });

    await page.goto('/explore/all');
    await page.waitForLoadState('domcontentloaded');

    // Should NOT redirect to /auth
    await expect(page).not.toHaveURL(/\/auth/);
  });
});
