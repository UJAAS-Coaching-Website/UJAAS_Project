import { test, expect } from '@playwright/test';
import { login } from './utils/login';

test('student login works', async ({ page }) => {
  await login(page, 'student');
  await expect(page).toHaveURL(/student/);
});

test('faculty login works', async ({ page }) => {
  await login(page, 'faculty');
  await expect(page).toHaveURL(/faculty/);
});

test('admin login works', async ({ page }) => {
  await login(page, 'admin');
  await expect(page).toHaveURL(/admin/);
});

test('invalid login shows error', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="loginId"]', 'wrong');
  await page.fill('input[name="password"]', 'wrong');

  await page.click('button[type="submit"]');

  await expect(page.locator('text=Invalid')).toBeVisible();
});