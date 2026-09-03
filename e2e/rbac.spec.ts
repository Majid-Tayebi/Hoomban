import { test, expect } from '@playwright/test';

test.describe('dashboard RBAC', () => {
	test.describe('secretary', () => {
		test('is redirected away from patient records', async ({ page }) => {
			await page.context().clearCookies();
			const res = await page.request.post('/api/auth/login', {
				data: { username: 'secretary', password: '12341234' }
			});
			expect(res.ok()).toBeTruthy();
			await page.goto('/dashboard/patients');
			await expect(page).not.toHaveURL(/\/dashboard\/patients\/?$/);
		});
	});

	test.describe('doctor', () => {
		test.use({ storageState: 'e2e/.auth/doctor.json' });

		test('can open patient list', async ({ page }) => {
			await page.goto('/dashboard/patients');
			await expect(page).toHaveURL(/\/dashboard\/patients/);
		});
	});
});
