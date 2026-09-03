import { expect, type APIRequestContext, type Page } from '@playwright/test';

export type DevRole = 'patient' | 'doctor' | 'admin' | 'secretary' | 'writer';

const DEV_PASSWORD = '12341234';

/** API login with session cookie — faster and more reliable than UI quick-login. */
export async function devLogin(page: Page, role: DevRole) {
	await loginWithApi(page.request, role);
	await page.goto('/dashboard');
	await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
	await waitForClientAuth(page);
}

export async function loginWithApi(request: APIRequestContext, role: DevRole) {
	const res = await request.post('/api/auth/login', {
		data: { username: role, password: DEV_PASSWORD }
	});
	expect(res.ok(), `login failed for ${role}: ${await res.text()}`).toBeTruthy();
}

/** Ensure cookie-only sessions hydrate PocketBase client auth before UI assertions. */
export async function waitForClientAuth(page: Page) {
	await page
		.waitForResponse(
			(res) => res.url().includes('/api/auth/session') && res.request().method() === 'GET',
			{ timeout: 30_000 }
		)
		.catch(() => {});
	await expect(
		page.getByTestId('app-shell-ready').or(page.getByTestId('app-shell-guest'))
	).toBeVisible({ timeout: 30_000 });
}

/** UI quick-login fallback when API login is unavailable. */
export async function devLoginViaUi(page: Page, role: DevRole) {
	await page.goto('/auth');
	const details = page.locator('details').filter({ hasText: 'ورود سریع توسعه' });
	await details.locator('summary').click();
	const button = page.getByTestId(`dev-login-${role}`);
	await expect(button).toBeVisible({ timeout: 15_000 });
	await button.click();
	await expect(page).toHaveURL(/\/dashboard/, { timeout: 45_000 });
}
