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
const PASS = 'UserPassword123!';
const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
const adminPass = process.env.POCKETBASE_ADMIN_PASSWORD;

await pb.collection('_superusers').authWithPassword(adminEmail, adminPass);

// Find a doctor + patient for seed note
const doctors = await pb.collection('doctors').getList(1, 1);
const patients = await pb.collection('users').getList(1, 1, { filter: 'role = "patient"' });
if (!doctors.items.length || !patients.items.length) {
	console.error('Need doctor + patient seed');
	process.exit(1);
}
const doctorId = doctors.items[0].id;
const patientId = patients.items[0].id;

const note = await pb.collection('clinical_notes').create({
	patient: patientId,
	doctor: doctorId,
	text: 'ACL test note — محرمانه',
	treatment_plan: 'test',
	session_date: new Date().toISOString()
});
console.log('created note', note.id);

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

pb.authStore.clear();
await expectFail('guest staff_registry list has items', async () => {
	const r = await pb.collection('staff_registry').getList(1, 1);
	if (r.items.length > 0) return r;
	// empty is OK for list-as-filter; try getOne if we know an id
	const adminPb = new PocketBase('http://127.0.0.1:8090');
	await adminPb.collection('_superusers').authWithPassword(adminEmail, adminPass);
	const staff = await adminPb.collection('staff_registry').getList(1, 1);
	if (!staff.items.length) throw new Error('no staff to test');
	pb.authStore.clear();
	await pb.collection('staff_registry').getOne(staff.items[0].id);
});

pb.authStore.clear();
await pb.collection('users').authWithPassword('user_09120000003@hoomban.com', PASS);
await expectFail('secretary view clinical note', () => pb.collection('clinical_notes').getOne(note.id));
await expectFail('secretary create clinical note', () =>
	pb.collection('clinical_notes').create({
		patient: patientId,
		doctor: doctorId,
		text: 'hack'
	})
);

pb.authStore.clear();
await pb.collection('users').authWithPassword('user_09121111111@hoomban.com', PASS);
await expectFail('patient view clinical note', () => pb.collection('clinical_notes').getOne(note.id));

pb.authStore.clear();
await pb.collection('users').authWithPassword('user_09120000001@hoomban.com', PASS);
const docUser = pb.authStore.model;
const myDoctor = await pb.collection('doctors').getList(1, 1, { filter: `user = "${docUser.id}"` });
if (myDoctor.items.length && myDoctor.items[0].id === doctorId) {
	await expectOk('owner doctor view note', () => pb.collection('clinical_notes').getOne(note.id));
} else {
	// may not be owner of this note's doctor
	const owned = await pb.collection('clinical_notes').getList(1, 1, {
		filter: `doctor = "${myDoctor.items[0]?.id || 'x'}"`
	});
	console.log('doctor own notes visible count', owned.items.length);
}

// cleanup
await pb.collection('_superusers').authWithPassword(adminEmail, adminPass);
await pb.collection('clinical_notes').delete(note.id);
console.log('cleaned up test note');
console.log('ACL VERIFY DONE');
