import PocketBase from 'pocketbase';
import { readFileSync, existsSync } from 'fs';

function loadEnv() {
	if (!existsSync('.env.local')) return;
	for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
		const m = line.match(/^([^#=]+)=(.*)$/);
		if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
	}
}
loadEnv();

const pb = new PocketBase('http://127.0.0.1:8090');
await pb.collection('_superusers').authWithPassword(
	process.env.POCKETBASE_ADMIN_EMAIL,
	process.env.POCKETBASE_ADMIN_PASSWORD
);

const c = await pb.collections.getOne('transactions');
console.log('transactions rules:', {
	listRule: c.listRule,
	createRule: c.createRule,
	updateRule: c.updateRule
});
console.log('fields:', c.fields.map((f) => f.name).join(', '));

pb.authStore.clear();
const auth = await pb.collection('users').authWithPassword(
	'user_09120000003@hoomban.com',
	'UserPassword123!'
);
console.log('secretary role:', auth.record.role);

try {
	const patients = await pb.collection('users').getList(1, 1, { filter: "role = 'patient'" });
	const pid = patients.items[0]?.id;
	const apts = await pb.collection('appointments').getList(1, 1, {
		filter: 'status != "cancelled"'
	});
	const apt = apts.items[0]?.id;
	const r = await pb.collection('transactions').create({
		patient: pid,
		appointment: apt,
		title: 'test',
		expected_amount: 1000,
		paid_amount: 500,
		status: 'partial',
		method: 'cash',
		paid_at: '2026-08-28',
		created_by: auth.record.id
	});
	console.log('create OK', r.id);
	await pb.collection('transactions').delete(r.id);
} catch (e) {
	console.log('create FAIL', e.status, e.response);
}
