import { test, expect } from '@playwright/test';
import { login } from './utils/login';

test('admin dashboard loads', async ({ page }) => {
    await login(page, 'admin');

    await expect(page.locator('text=Batches')).toBeVisible();
    await expect(page.locator('text=Students')).toBeVisible();
});