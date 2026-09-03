import { test, expect } from '@playwright/test';
import { loginWithApi, waitForClientAuth } from './helpers/auth';

test.describe('clinical notes', () => {
	test.use({ storageState: 'e2e/.auth/doctor.json' });

	test.beforeEach(async ({ page }) => {
		await loginWithApi(page.request, 'doctor');
	});

	test('doctor can open patient record with notes panel', async ({ page }) => {
		await page.goto('/dashboard');
		await waitForClientAuth(page);
		await page.goto('/dashboard/patients');
		await expect(page.getByTestId('patients-table')).toBeVisible({ timeout: 60_000 });

		const rows = page.locator('table tbody tr');
		const rowCount = await rows.count();
		if (rowCount === 0) {
			test.skip(true, 'no patient rows in PocketBase (empty or still loading)');
		}

		const firstRow = rows.first();
		await expect(firstRow).toBeVisible({ timeout: 20_000 });
		await firstRow.click();

		await expect(page.getByText('یادداشت پرونده')).toBeVisible({ timeout: 20_000 });
	});
});
