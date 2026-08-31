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
await pb.collection('_superusers').authWithPassword(
	process.env.POCKETBASE_ADMIN_EMAIL,
	process.env.POCKETBASE_ADMIN_PASSWORD
);

for (const n of ['staff_registry', 'clinical_notes', 'patient_profiles', 'appointments', 'sms_outbox']) {
	const c = await pb.collections.getOne(n);
	console.log('\n===', n, '===');
	console.log('listRule:', JSON.stringify(c.listRule));
	console.log('viewRule:', JSON.stringify(c.viewRule));
	console.log('createRule:', JSON.stringify(c.createRule));
	console.log('updateRule:', JSON.stringify(c.updateRule));
	console.log('deleteRule:', JSON.stringify(c.deleteRule));
}

const PASS = 'UserPassword123!';
pb.authStore.clear();
const auth = await pb.collection('users').authWithPassword('user_09120000003@hoomban.com', PASS);
console.log('\nsecretary model:', JSON.stringify({ id: auth.record.id, role: auth.record.role, mobile: auth.record.mobile }));
