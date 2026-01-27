// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('can navigate between explore locations', async ({ page }) => {
    await page.goto('/explore/all');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Lagos filter
    await page.goto('/explore/Lagos');
    await expect(page).toHaveURL(/\/explore\/Lagos/);

    // Navigate to Abuja filter
    await page.goto('/explore/Abuja');
    await expect(page).toHaveURL(/\/explore\/Abuja/);
  });

  test('reviews page loads', async ({ page }) => {
    await page.goto('/reviews');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/\/reviews/);
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('creator profile page loads', async ({ page }) => {
    await page.goto('/model/test_creator');
    await page.waitForLoadState('domcontentloaded');

    // Page should render without crashing (may show not-found state)
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('explore page renders on mobile viewport', async ({ page }) => {
    await page.goto('/explore/all');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('auth page renders on mobile viewport', async ({ page }) => {
    // Navigate to app origin first, then clear localStorage
    await page.goto('/explore/all');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.removeItem('hush_auth');
      localStorage.removeItem('hush_token');
    });

    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    // The auth flow starts with an age verification gate
    const ageContent = page.locator('text=/18|age|verify|confirm/i').first();
    await expect(ageContent).toBeVisible({ timeout: 10000 });
  });
});
