import { Page } from '@playwright/test';

type Role = 'student' | 'admin' | 'faculty';

export async function login(page: Page, role: Role) {
    await page.goto('http://localhost:3000/login'); // change port if needed

    if (role === 'student') {
        await page.fill('input[name="loginId"]', 'UJAAS-2026-007');
        await page.fill('input[name="password"]', 'ashish@123');
    }

    if (role === 'admin') {
        await page.fill('input[name="loginId"]', 'admin@ujaas.com');
        await page.fill('input[name="password"]', 'password123');
    }

    if (role === 'faculty') {
        await page.fill('input[name="loginId"]', 'faculty@ujaas.com');
        await page.fill('input[name="password"]', 'password123');
    }

    await page.click('button[type="submit"]');
}