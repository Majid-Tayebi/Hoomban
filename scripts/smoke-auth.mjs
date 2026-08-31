import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function check() {
	const health = await pb.health.check();
	console.log('health', health);

	const staff = await pb.collection('staff_registry').getList(1, 10);
	console.log(
		'staff_registry',
		staff.items.map((i) => `${i.mobile}:${i.role}`)
	);

	const doctors = await pb.collection('doctors').getList(1, 10, { expand: 'user' });
	console.log(
		'doctors',
		doctors.items.map((d) => `${d.expand?.user?.name || '?'} fee=${d.visit_fee}`)
	);

	const tests = await pb.collection('psych_tests').getList(1, 10, {
		filter: 'is_active = true'
	});
	console.log(
		'tests',
		tests.items.map((t) => `${t.slug}:${t.title}`)
	);

	const auth = await pb.collection('users').authWithPassword('user_09121111111@hoomban.com', 'UserPassword123!');
	console.log('patient login', auth.record.role, auth.record.name);

	pb.authStore.clear();
	const auth2 = await pb.collection('users').authWithPassword('user_09120000001@hoomban.com', 'UserPassword123!');
	console.log('doctor login', auth2.record.role, auth2.record.name);

	pb.authStore.clear();
	const auth3 = await pb.collection('users').authWithPassword('user_09120000003@hoomban.com', 'UserPassword123!');
	console.log('secretary login', auth3.record.role, auth3.record.name);

	console.log('OK');
}

check().catch((e) => {
	console.error('FAIL', e.message, e?.data);
	process.exit(1);
});
