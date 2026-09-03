import PocketBase from 'pocketbase';
import { readFileSync, existsSync } from 'fs';

if (existsSync('.env.local')) {
	for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
		const m = line.match(/^([^#=]+)=(.*)$/);
		if (m) process.env[m[1].trim()] = m[2].trim();
	}
}

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

await pb.admins.authWithPassword(
	process.env.POCKETBASE_ADMIN_EMAIL,
	process.env.POCKETBASE_ADMIN_PASSWORD
);

const users = await pb.collection('users').getFullList({ filter: 'role = "patient"' });
console.log(
	'patients:',
	users.map((u) => ({ id: u.id, email: u.email, username: u.username, mobile: u.mobile, name: u.name }))
);

const apts = await pb.collection('appointments').getList(1, 20, {
	sort: '-created',
	expand: 'patient'
});
console.log(
	'appointments:',
	apts.totalItems,
	apts.items.map((a) => ({
		id: a.id,
		patient: a.patient,
		status: a.status,
		date: a.date_time,
		patientName: a.expand?.patient?.name
	}))
);

const cols = await pb.collections.getFullList();
const aptCol = cols.find((c) => c.name === 'appointments');
console.log('rules:', {
	list: aptCol?.listRule,
	view: aptCol?.viewRule,
	update: aptCol?.updateRule
});

// test patient auth
const patient = users.find((u) => u.username === 'patient') || users[0];
if (patient) {
	const client = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
	try {
		await client.collection('users').authWithPassword(patient.email, '12341234');
		console.log('patient auth ok', patient.id);
		const list = await client.collection('appointments').getList(1, 10, {
			filter: `patient = "${patient.id}"`,
			sort: '-date_time',
			expand: 'patient,doctor,doctor.user'
		});
		console.log('patient list with expand:', list.totalItems);
	} catch (e) {
		console.log('patient client error:', e.message, e.response?.data || '');
	}
}
