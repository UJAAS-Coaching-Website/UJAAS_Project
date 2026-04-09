import { test, expect } from '@playwright/test';
import { login } from './utils/login';

test('faculty dashboard loads', async ({ page }) => {
  await login(page, 'faculty');

  await expect(page.locator('text=Batches')).toBeVisible();
  await expect(page.locator('text=Test Series')).toBeVisible();
});