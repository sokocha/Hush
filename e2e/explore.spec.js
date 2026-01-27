// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Explore Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore/all');
    await page.waitForLoadState('networkidle');
  });

  test('displays the explore page with heading', async ({ page }) => {
    // The page should have some visible content
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();
  });

  test('shows creator cards or empty state', async ({ page }) => {
    // Either creator cards are visible or an empty state message is shown
    const cards = page.locator('[data-testid="creator-card"], [class*="card"], [class*="Card"]');
    const emptyState = page.locator('text=/no.*creators|no.*results|no.*found/i');

    const hasCards = await cards.count() > 0;
    const hasEmpty = await emptyState.count() > 0;

    // One of these should be true
    expect(hasCards || hasEmpty).toBe(true);
  });

  test('location filter navigation works', async ({ page }) => {
    await page.goto('/explore/Lagos');
    await expect(page).toHaveURL(/\/explore\/Lagos/);
    await page.waitForLoadState('networkidle');

    // Page should still render
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('explore page is accessible without authentication', async ({ page }) => {
    // Clear any auth state
    await page.evaluate(() => {
      localStorage.removeItem('hush_auth');
      localStorage.removeItem('hush_token');
    });

    await page.goto('/explore/all');
    await page.waitForLoadState('networkidle');

    // Should NOT redirect to /auth
    await expect(page).not.toHaveURL(/\/auth/);
  });
});
