// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('landing page redirects to /explore/all', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/explore\/all/);
  });

  test('app renders without crashing', async ({ page }) => {
    await page.goto('/explore/all');
    await page.waitForLoadState('networkidle');

    // Page should not show a blank white screen or error
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should not have uncaught JS errors
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('invalid routes redirect to /explore/all', async ({ page }) => {
    await page.goto('/some/invalid/path');
    await expect(page).toHaveURL(/\/explore\/all/);
  });
});
