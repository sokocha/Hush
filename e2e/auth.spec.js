// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Auth Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear auth state before each test
    await page.goto('/explore/all');
    await page.evaluate(() => {
      localStorage.removeItem('hush_auth');
      localStorage.removeItem('hush_token');
    });
  });

  test('auth page loads and shows phone input', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Should show some form of phone number input
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i], input[name*="phone" i]');
    await expect(phoneInput).toBeVisible();
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
    await page.waitForLoadState('networkidle');

    // Should redirect away from auth page
    await expect(page).not.toHaveURL(/\/auth$/);
  });
});

test.describe('Protected Routes', () => {
  test('unauthenticated user is redirected from /dashboard', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('hush_auth');
      localStorage.removeItem('hush_token');
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should redirect to /auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test('unauthenticated user is redirected from /creator-dashboard', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('hush_auth');
      localStorage.removeItem('hush_token');
    });

    await page.goto('/creator-dashboard');
    await page.waitForLoadState('networkidle');

    // Should redirect to /auth
    await expect(page).toHaveURL(/\/auth/);
  });
});
