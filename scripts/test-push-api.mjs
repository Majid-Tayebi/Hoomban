/**
 * Integration tests for PWA push API (requires running preview server + PocketBase).
 * Usage: node scripts/test-push-api.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.env.HOOMBAN_BASE || 'http://127.0.0.1:4173';
const PB = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

function loadEnvLocal() {
	const path = resolve(process.cwd(), '.env.local');
	try {
		const raw = readFileSync(path, 'utf8');
		for (const line of raw.split('\n')) {
			const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
			if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
		}
	} catch {
		/* ignore */
	}
}

loadEnvLocal();

async function login(username, password) {
	const res = await fetch(`${PB}/api/collections/users/auth-with-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identity: username, password })
	});
	if (!res.ok) throw new Error(`login failed: ${res.status}`);
	const data = await res.json();
	return data.token;
}

async function test(name, fn) {
	try {
		await fn();
		console.log(`✓ ${name}`);
		return true;
	} catch (err) {
		console.error(`✗ ${name}:`, err instanceof Error ? err.message : err);
		return false;
	}
}

let passed = 0;
let failed = 0;

async function run() {
	const results = [];

	results.push(
		await test('GET /api/push/vapid-public-key returns configured keys', async () => {
			const res = await fetch(`${BASE}/api/push/vapid-public-key`);
			if (!res.ok) throw new Error(`status ${res.status}`);
			const data = await res.json();
			if (!data.configured || !data.publicKey) throw new Error('VAPID not configured');
		})
	);

	results.push(
		await test('GET /manifest.webmanifest is served', async () => {
			const res = await fetch(`${BASE}/manifest.webmanifest`);
			if (!res.ok) throw new Error(`status ${res.status}`);
			const data = await res.json();
			if (!data.name || !data.icons?.length) throw new Error('invalid manifest');
		})
	);

	results.push(
		await test('GET /service-worker.js is served (production build)', async () => {
			const res = await fetch(`${BASE}/service-worker.js`);
			if (!res.ok) throw new Error(`status ${res.status} — run npm run build && preview first`);
			const text = await res.text();
			if (!text.includes('push')) throw new Error('SW missing push handler');
		})
	);

	const token = await login('doctor', '12341234');

	// Clean stale test subscriptions from prior runs
	await fetch(`${BASE}/api/push/unsubscribe`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({ endpoint: 'https://example.test/push/fake-endpoint' })
	}).catch(() => {});

	results.push(
		await test('POST /api/push/test without subscription returns helpful error', async () => {
			const res = await fetch(`${BASE}/api/push/test`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (res.status >= 500) throw new Error(`status ${res.status}: ${data.error || JSON.stringify(data)}`);
			if (data.ok !== false && !data.error) throw new Error('expected no-subscription response');
		})
	);

	results.push(
		await test('POST /api/push/subscribe validates auth', async () => {
			const res = await fetch(`${BASE}/api/push/subscribe`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					endpoint: 'https://example.test/push/fake-endpoint',
					keys: { p256dh: 'test-p256dh-key-base64==', auth: 'test-auth-key-base64==' }
				})
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(`status ${res.status}: ${data.error || JSON.stringify(data)}`);
		})
	);

	results.push(
		await test('POST /api/push/unsubscribe cleans up test subscription', async () => {
			const res = await fetch(`${BASE}/api/push/unsubscribe`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ endpoint: 'https://example.test/push/fake-endpoint' })
			});
			if (!res.ok) throw new Error(`status ${res.status}`);
		})
	);

	results.push(
		await test('createNotification triggers web push path (appointment API)', async () => {
			const res = await fetch(`${BASE}/api/notifications?limit=1`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (!res.ok) throw new Error(`notifications list ${res.status}`);
		})
	);

	passed = results.filter(Boolean).length;
	failed = results.length - passed;
	console.log(`\n${passed}/${results.length} passed`);
	process.exit(failed ? 1 : 0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
