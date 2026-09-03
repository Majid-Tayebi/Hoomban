import { test, expect } from '@playwright/test';
import { loginWithApi } from './helpers/auth';

test.describe('booking flow', () => {
	test.use({ storageState: 'e2e/.auth/patient.json' });

	test.beforeEach(async ({ page }) => {
		await loginWithApi(page.request, 'patient');
	});

	test('patient sees booking wizard', async ({ page }) => {
		await page.goto('/appointments/book');
		await expect(page.getByText('برای رزرو وارد شوید')).toBeHidden({ timeout: 30_000 });
		await expect(page.getByTestId('booking-wizard')).toBeVisible({ timeout: 60_000 });
	});
});
