import { test as setup, expect } from '@playwright/test';
import { loginWithApi, waitForClientAuth, type DevRole } from './helpers/auth';
import fs from 'node:fs';
import path from 'node:path';

const authDir = path.join('e2e', '.auth');
/** Roles used by E2E specs — keep minimal to reduce setup time. */
const roles: DevRole[] = ['patient', 'doctor', 'secretary', 'admin'];

setup.beforeAll(() => {
	fs.mkdirSync(authDir, { recursive: true });
});

for (const role of roles) {
	setup(`authenticate ${role}`, async ({ page }) => {
		await loginWithApi(page.request, role);
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
		await waitForClientAuth(page);
		await page.context().storageState({ path: path.join(authDir, `${role}.json`) });
	});
}
