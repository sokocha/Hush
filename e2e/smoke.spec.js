// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('landing page redirects to /explore/all', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/explore\/all/);
  });

  test('app renders without crashing', async ({ page }) => {
    await page.goto('/explore/all');
    await page.waitForLoadState('domcontentloaded');

    // The React root should mount and render content
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('invalid routes redirect to /explore/all', async ({ page }) => {
    await page.goto('/some/invalid/path');
    await expect(page).toHaveURL(/\/explore\/all/);
  });
});
