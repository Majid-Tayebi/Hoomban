import { test, expect } from '@playwright/test';
import { loginWithApi } from './helpers/auth';

const PB_URL = process.env.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

test.describe('security hardening', () => {
	test('patient cannot self-escalate role via PocketBase users update', async ({ request }) => {
		const login = await request.post('/api/auth/login', {
			data: { username: 'patient', password: '12341234' }
		});
		expect(login.ok()).toBeTruthy();
		const session = await request.get('/api/auth/session');
		expect(session.ok()).toBeTruthy();
		const { token, record } = (await session.json()) as {
			token: string;
			record: { id: string; role: string };
		};
		expect(record.role).toBe('patient');

		const escalate = await request.patch(`${PB_URL}/api/collections/users/records/${record.id}`, {
			headers: {
				Authorization: token,
				'Content-Type': 'application/json'
			},
			data: { role: 'admin' }
		});
		expect(escalate.ok()).toBeFalsy();
		expect(escalate.status()).toBeGreaterThanOrEqual(400);

		const refresh = await request.get('/api/auth/session');
		const again = (await refresh.json()) as { record: { role: string } };
		expect(again.record.role).toBe('patient');
	});

	test('service checkout rejects client-supplied price without serviceId', async ({ request }) => {
		await loginWithApi(request, 'patient');
		const session = await request.get('/api/auth/session');
		const { token, record } = (await session.json()) as {
			token: string;
			record: { id: string };
		};

		const res = await request.post('/api/payments/zarinpal/request', {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
				Origin: 'http://127.0.0.1:5173'
			},
			data: {
				patientId: record.id,
				doctorId: 'any-doctor-id',
				dateTime: new Date(Date.now() + 86400000).toISOString(),
				type: 'service',
				servicePriceToman: 1,
				serviceTitle: 'hacked'
			}
		});

		// Must not start a 1-toman checkout — expect 400 (missing serviceId) or 503 if gateway off
		expect([400, 403, 503]).toContain(res.status());
		const body = (await res.json()) as { error?: string; paymentUrl?: string };
		expect(body.paymentUrl).toBeFalsy();
		if (res.status() === 400) {
			expect(String(body.error || '')).toMatch(/خدمت|شناسه|مبلغ|فعال/i);
		}
	});

	test('cross-origin mutating API is rejected', async ({ request }) => {
		await loginWithApi(request, 'patient');
		const res = await request.patch('/api/profile', {
			headers: {
				'Content-Type': 'application/json',
				Origin: 'https://evil.example'
			},
			data: { section: 'details', name: 'حمله' }
		});
		expect(res.status()).toBe(403);
	});
});
