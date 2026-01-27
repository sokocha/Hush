// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Auth Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first so localStorage is on the correct origin
    await page.goto('/explore/all');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.removeItem('hush_auth');
      localStorage.removeItem('hush_token');
    });
  });

  test('auth page loads and shows age verification gate', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    // The auth flow starts with an age verification step
    // Look for the age confirmation button or the 18+ text
    const ageContent = page.locator('text=/18|age|verify|confirm/i').first();
    await expect(ageContent).toBeVisible({ timeout: 10000 });
  });

  test('auth page is accessible at /auth', async ({ page }) => {
    await page.goto('/auth');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('authenticated user is redirected away from /auth', async ({ page }) => {
    // Simulate an authenticated user via localStorage
    await page.evaluate(() => {
      localStorage.setItem('hush_auth', JSON.stringify({
        id: 'test-user-1',
        phone: '+2348012345678',
        username: 'testclient',
        name: 'Test Client',
        userType: 'client',
        isLoggedIn: true,
      }));
    });

    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    // Wait for React to process the redirect
    await page.waitForTimeout(2000);

    // Should redirect away from auth page
    await expect(page).not.toHaveURL(/\/auth$/);
  });
});

test.describe('Protected Routes', () => {
  test('unauthenticated user is redirected from /dashboard', async ({ page }) => {
    // Navigate to app origin first to set localStorage on correct origin
    await page.goto('/explore/all');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.removeItem('hush_auth');
      localStorage.removeItem('hush_token');
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Wait for React to process the redirect
    await page.waitForTimeout(2000);

    // Should redirect to /auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test('unauthenticated user is redirected from /creator-dashboard', async ({ page }) => {
    // Navigate to app origin first to set localStorage on correct origin
    await page.goto('/explore/all');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.removeItem('hush_auth');
      localStorage.removeItem('hush_token');
    });

    await page.goto('/creator-dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Wait for React to process the redirect
    await page.waitForTimeout(2000);

    // Should redirect to /auth
    await expect(page).toHaveURL(/\/auth/);
  });
});
