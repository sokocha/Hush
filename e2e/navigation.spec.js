// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('can navigate between explore locations', async ({ page }) => {
    await page.goto('/explore/all');
    await page.waitForLoadState('networkidle');

    // Navigate to Lagos filter
    await page.goto('/explore/Lagos');
    await expect(page).toHaveURL(/\/explore\/Lagos/);
    await page.waitForLoadState('networkidle');

    // Navigate to Abuja filter
    await page.goto('/explore/Abuja');
    await expect(page).toHaveURL(/\/explore\/Abuja/);
  });

  test('reviews page loads', async ({ page }) => {
    await page.goto('/reviews');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/reviews/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('creator profile page loads', async ({ page }) => {
    // Navigate to a creator profile (may show 404-style if creator doesn't exist,
    // but page should still render without crashing)
    await page.goto('/model/test_creator');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('page has no console errors on main routes', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const routes = ['/explore/all', '/auth', '/reviews'];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    }

    // Filter out expected Supabase connection errors (no real backend in E2E)
    const unexpectedErrors = errors.filter(
      (e) => !e.includes('supabase') && !e.includes('fetch') && !e.includes('Failed to fetch')
    );
    expect(unexpectedErrors).toHaveLength(0);
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('explore page renders on mobile viewport', async ({ page }) => {
    await page.goto('/explore/all');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('auth page renders on mobile viewport', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('hush_auth');
      localStorage.removeItem('hush_token');
    });

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i], input[name*="phone" i]');
    await expect(phoneInput).toBeVisible();
  });
});
