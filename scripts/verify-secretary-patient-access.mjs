import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');
await pb.collection('users').authWithPassword('user_09120000003@hoomban.com', 'UserPassword123!');

try {
	const r = await pb.collection('patient_profiles').getList(1, 1);
	console.log('patient_profiles list OK', r.totalItems, r.items.length);
} catch (e) {
	console.log('patient_profiles list DENIED', e.status, e.message);
}

try {
	const r = await pb.collection('clinical_notes').getList(1, 1);
	console.log('clinical_notes list OK', r.totalItems);
} catch (e) {
	console.log('clinical_notes list DENIED', e.status, e.message);
}
