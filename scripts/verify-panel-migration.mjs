import PocketBase from 'pocketbase';
import { readFileSync, existsSync } from 'fs';

function loadEnv() {
	const p = '.env.local';
	if (!existsSync(p)) return;
	for (const line of readFileSync(p, 'utf8').split('\n')) {
		const m = line.match(/^([^#=]+)=(.*)$/);
		if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
	}
}
loadEnv();

const pb = new PocketBase('http://127.0.0.1:8090');
const email = process.env.POCKETBASE_ADMIN_EMAIL;
const pass = process.env.POCKETBASE_ADMIN_PASSWORD;

try {
	await pb.collection('_superusers').authWithPassword(email, pass);
	console.log('admin auth: _superusers OK');
} catch (e1) {
	try {
		await pb.admins.authWithPassword(email, pass);
		console.log('admin auth: admins OK');
	} catch (e2) {
		console.error('admin auth FAIL', e1.message, e2?.message);
		process.exit(1);
	}
}

const names = [
	'patient_profiles',
	'clinical_notes',
	'sms_outbox',
	'doctors',
	'appointments',
	'articles',
	'psych_tests',
	'staff_registry'
];

for (const n of names) {
	try {
		const c = await pb.collections.getOne(n);
		const fields = (c.fields || []).map((f) => f.name).join(', ');
		console.log('OK', n, '|', fields);
	} catch (e) {
		console.error('MISSING', n, e.message);
	}
}

// ACL: staff_registry not public
pb.authStore.clear();
try {
	await pb.collection('staff_registry').getList(1, 1);
	console.error('FAIL: staff_registry still public');
} catch {
	console.log('OK: staff_registry locked for guests');
}

const PASS = 'UserPassword123!';
await pb.collection('users').authWithPassword('user_09120000003@hoomban.com', PASS);
try {
	await pb.collection('clinical_notes').getList(1, 1);
	console.error('FAIL: secretary listed clinical_notes');
} catch {
	console.log('OK: secretary cannot list clinical_notes');
}

pb.authStore.clear();
await pb.collection('users').authWithPassword('user_09121111111@hoomban.com', PASS);
try {
	await pb.collection('clinical_notes').getList(1, 1);
	console.error('FAIL: patient listed clinical_notes');
} catch {
	console.log('OK: patient cannot list clinical_notes');
}

pb.authStore.clear();
await pb.collection('users').authWithPassword('user_09120000001@hoomban.com', PASS);
try {
	const list = await pb.collection('clinical_notes').getList(1, 1);
	console.log('OK: doctor can list clinical_notes, total=', list.totalItems);
} catch (e) {
	console.log('WARN doctor clinical_notes:', e.message);
}

console.log('DONE');
