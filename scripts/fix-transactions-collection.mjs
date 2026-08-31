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

const adminOrSec =
	"@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'secretary')";

const existing = await pb.collections.getOne('transactions');
const names = new Set(existing.fields.map((f) => f.name));

const extraFields = [
	{
		name: 'patient',
		type: 'relation',
		required: true,
		collectionId: '_pb_users_auth_',
		cascadeDelete: false,
		maxSelect: 1
	},
	{
		name: 'appointment',
		type: 'relation',
		required: false,
		collectionId: 'pbc_1037645436',
		cascadeDelete: false,
		maxSelect: 1
	},
	{ name: 'title', type: 'text', required: true, max: 200 },
	{ name: 'expected_amount', type: 'number', required: true, min: 0 },
	{ name: 'paid_amount', type: 'number', required: false, min: 0 },
	{
		name: 'status',
		type: 'select',
		required: true,
		maxSelect: 1,
		values: ['paid', 'unpaid', 'partial', 'waived']
	},
	{
		name: 'method',
		type: 'select',
		required: false,
		maxSelect: 1,
		values: ['cash', 'card', 'transfer', 'other']
	},
	{ name: 'paid_at', type: 'date', required: false },
	{ name: 'notes', type: 'text', required: false, max: 500 },
	{
		name: 'created_by',
		type: 'relation',
		required: false,
		collectionId: '_pb_users_auth_',
		cascadeDelete: false,
		maxSelect: 1
	}
];

const fields = [...existing.fields];
for (const def of extraFields) {
	if (!names.has(def.name)) fields.push(def);
}

await pb.collections.update(existing.id, {
	fields,
	listRule: adminOrSec,
	viewRule: adminOrSec,
	createRule: adminOrSec,
	updateRule: adminOrSec,
	deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'"
});

console.log('✅ transactions collection updated');

const verify = await pb.collections.getOne('transactions');
console.log('fields:', verify.fields.map((f) => f.name).join(', '));
console.log('createRule:', verify.createRule);

pb.authStore.clear();
const auth = await pb.collection('users').authWithPassword(
	'user_09120000003@hoomban.com',
	'UserPassword123!'
);

const patients = await pb.collection('users').getList(1, 1, { filter: "role = 'patient'" });
const apts = await pb.collection('appointments').getList(1, 1, { filter: 'status != "cancelled"' });

const r = await pb.collection('transactions').create({
	patient: patients.items[0].id,
	appointment: apts.items[0]?.id,
	title: 'test payment',
	expected_amount: 1000,
	paid_amount: 500,
	status: 'partial',
	method: 'cash',
	paid_at: '2026-08-28',
	created_by: auth.record.id
});
console.log('✅ secretary create OK:', r.id);
await pb.collection('transactions').delete(r.id);
