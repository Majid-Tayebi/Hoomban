import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

try {
	await pb.collection('users').authWithPassword('dev_patient@hoomban.local', '12341234');
	const uid = pb.authStore.model?.id;
	console.log('auth ok', uid, pb.authStore.model?.role);

	const r1 = await pb.collection('appointments').getList(1, 10, {
		filter: `patient = "${uid}"`,
		sort: '-date_time'
	});
	console.log(
		'without expand:',
		r1.totalItems,
		r1.items.map((i) => ({ id: i.id, status: i.status, date: i.date_time, patient: i.patient }))
	);

	try {
		const r2 = await pb.collection('appointments').getList(1, 10, {
			filter: `patient = "${uid}"`,
			sort: '-date_time',
			expand: 'patient,doctor,doctor.user'
		});
		console.log('with expand:', r2.totalItems);
	} catch (e) {
		console.log('expand failed:', e.message);
	}
} catch (e) {
	console.log('err', e.message);
}
