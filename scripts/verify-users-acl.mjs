import PocketBase from 'pocketbase';
import { readFileSync, existsSync } from 'fs';

function loadEnv() {
	for (const p of ['.env.local', '.env']) {
		if (!existsSync(p)) continue;
		for (const line of readFileSync(p, 'utf8').split('\n')) {
			const m = line.match(/^([^#=]+)=(.*)$/);
			if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
		}
	}
}
loadEnv();

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const DEV_PASS = '12341234';

const pb = new PocketBase(PB_URL);
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
const adminPass = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!adminEmail || !adminPass) {
	console.error('POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD required');
	process.exit(1);
}

async function expectFail(label, fn) {
	try {
		await fn();
		console.error('FAIL:', label, '— expected denial');
		return false;
	} catch (e) {
		console.log('OK:', label, '— denied (', e.status || e.message, ')');
		return true;
	}
}

async function expectOk(label, fn) {
	try {
		await fn();
		console.log('OK:', label);
		return true;
	} catch (e) {
		console.error('FAIL:', label, e.message);
		return false;
	}
}

await pb.collection('_superusers').authWithPassword(adminEmail, adminPass);

// Find a non-patient staff user (doctor or admin)
const staffUsers = await pb.collection('users').getList(1, 10, {
	filter: 'role != "patient"'
});
const patientUsers = await pb.collection('users').getList(1, 5, {
	filter: 'role = "patient"'
});

if (!staffUsers.items.length || !patientUsers.items.length) {
	console.error('Need staff + patient seed users');
	process.exit(1);
}

const staffUser = staffUsers.items.find((u) => u.role === 'doctor') || staffUsers.items[0];
const patientUser = patientUsers.items[0];

// --- Secretary: can list patients ---
pb.authStore.clear();
await pb.collection('users').authWithPassword('secretary', DEV_PASS);
await expectOk('secretary list patients', async () => {
	const r = await pb.collection('users').getList(1, 5, { filter: 'role = "patient"' });
	if (r.items.length === 0) throw new Error('no patients visible');
});

await expectFail('secretary view staff user by id', () =>
	pb.collection('users').getOne(staffUser.id)
);

// --- Doctor: can list patients, not arbitrary staff ---
pb.authStore.clear();
await pb.collection('users').authWithPassword('doctor', DEV_PASS);
await expectOk('doctor list patients', async () => {
	const r = await pb.collection('users').getList(1, 5, { filter: 'role = "patient"' });
	if (r.items.length === 0) throw new Error('no patients visible');
});

const otherStaff = staffUsers.items.find((u) => u.role === 'admin' || u.role === 'secretary');
if (otherStaff) {
	await expectFail('doctor view non-patient staff user', () =>
		pb.collection('users').getOne(otherStaff.id)
	);
}

// --- psych_results: secretary sees no results (PB list rules filter records, not 403) ---
pb.authStore.clear();
await pb.collection('users').authWithPassword('secretary', DEV_PASS);
await expectOk('secretary psych_results empty', async () => {
	const r = await pb.collection('psych_results').getList(1, 5);
	if (r.items.length > 0) throw new Error('secretary must not see psych results');
});

// --- psych_results: patient sees own only (list works for self) ---
pb.authStore.clear();
await pb.collection('users').authWithPassword('patient', DEV_PASS);
await expectOk('patient list own psych_results', () =>
	pb.collection('psych_results').getList(1, 5)
);

// --- psych_results: direct client create denied (server-only insert) ---
await expectFail('patient direct psych_results create denied', () =>
	pb.collection('psych_results').create({
		user: pb.authStore.model.id,
		test: 'invalid',
		answers_json: [],
		scores_json: { total: 999 },
		interpretation_text: 'forged'
	})
);

console.log('USERS ACL VERIFY DONE');
