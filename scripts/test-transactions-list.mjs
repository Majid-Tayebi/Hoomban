import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');
await pb.collection('users').authWithPassword(
	'user_09120000003@hoomban.com',
	'UserPassword123!'
);

const tests = [
	{ name: 'no options', opts: {} },
	{ name: 'sort -created', opts: { sort: '-created' } },
	{ name: 'sort -updated', opts: { sort: '-updated' } },
	{ name: 'sort title', opts: { sort: 'title' } },
	{ name: 'filter status unpaid', opts: { filter: 'status = "unpaid"' } },
	{ name: 'filter patient not empty', opts: { filter: 'patient != ""' } },
	{
		name: 'filter specific patient',
		opts: { filter: 'patient = "js6n423z57h30kh"', sort: '-created' }
	},
	{
		name: 'filter specific patient sort title',
		opts: { filter: 'patient = "js6n423z57h30kh"', sort: '-title' }
	}
];

for (const t of tests) {
	try {
		const r = await pb.collection('transactions').getList(1, 5, t.opts);
		console.log(`✅ ${t.name}:`, r.totalItems, 'items');
	} catch (e) {
		console.log(`❌ ${t.name}:`, e.status, e.message);
		if (e.response) console.log('   response:', JSON.stringify(e.response).slice(0, 300));
	}
}
