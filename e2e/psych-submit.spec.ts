import { test, expect } from '@playwright/test';

const unauthenticated = { cookies: [], origins: [] } as const;

test.describe('psych submit API', () => {
	test.use({ storageState: unauthenticated });

	test('generic submit returns 401 without auth', async ({ request }) => {
		const res = await request.post('/api/psych/generic/submit', {
			data: { testId: 'invalid', answers: {} }
		});
		expect(res.status()).toBe(401);
		const body = (await res.json()) as { error?: string };
		expect(body.error).toBeTruthy();
	});

	test('neo-240 submit returns 401 without auth', async ({ request }) => {
		const res = await request.post('/api/psych/neo-240/submit', {
			data: { testId: 'invalid', answers: {} }
		});
		expect(res.status()).toBe(401);
	});
});
