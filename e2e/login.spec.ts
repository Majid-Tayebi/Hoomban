import { test, expect } from '@playwright/test';
import { devLogin } from './helpers/auth';

const unauthenticated = { cookies: [], origins: [] } as const;

test.describe('login flow', () => {
	test.use({ storageState: unauthenticated });

	test('api login redirects to dashboard', async ({ page }) => {
		await devLogin(page, 'patient');
		await expect(page).toHaveURL(/\/dashboard/);
	});

	test('doctor can access dashboard', async ({ page }) => {
		await devLogin(page, 'doctor');
		await expect(page).toHaveURL(/\/dashboard/);
	});
});
