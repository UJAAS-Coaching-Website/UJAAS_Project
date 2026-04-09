import { test, expect } from '@playwright/test';
import { login } from './utils/login';

test('student dashboard loads', async ({ page }) => {
  await login(page, 'student');

  await expect(page.locator('text=Dashboard')).toBeVisible();
  await expect(page.locator('text=Performance')).toBeVisible();
});