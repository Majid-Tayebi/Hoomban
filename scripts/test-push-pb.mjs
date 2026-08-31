/**
 * Direct PocketBase admin test for push_subscriptions collection.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import PocketBase from 'pocketbase';

function loadEnvLocal() {
	const path = resolve(process.cwd(), '.env.local');
	const raw = readFileSync(path, 'utf8');
	for (const line of raw.split('\n')) {
		const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
		if (m) process.env[m[1]] = m[2];
	}
}

loadEnvLocal();

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

async function main() {
	await pb.collection('_superusers').authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL,
		process.env.POCKETBASE_ADMIN_PASSWORD
	);

	const users = await pb.collection('users').getList(1, 1, {
		filter: 'username = "doctor"'
	});
	const userId = users.items[0]?.id;
	if (!userId) throw new Error('doctor user not found');

	const record = await pb.collection('push_subscriptions').create({
		user: userId,
		endpoint: 'https://example.test/push/debug-endpoint',
		p256dh: 'debug-p256dh',
		auth: 'debug-auth',
		enabled: true
	});

	console.log('created', record.id);

	await pb.collection('push_subscriptions').delete(record.id);
	console.log('deleted ok');
}

main().catch((err) => {
	console.error('FAIL:', err?.response?.data || err.message || err);
	process.exit(1);
});
