import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase('http://127.0.0.1:8090');

async function fixAppointmentsFields() {
	try {
		console.log('🔧 اصلاح فیلدهای کالکشن appointments...');

		// Login as superuser
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ ورود superuser موفقیت‌آمیز');

		// Get users and doctors collection IDs
		const collections = await pb.collections.getList(1, 50, {});
		const usersCol = collections.items.find(c => c.name === 'users');
		const doctorsCol = collections.items.find(c => c.name === 'doctors');
		const appointmentsCol = collections.items.find(c => c.name === 'appointments');

		if (!appointmentsCol) {
			console.error('❌ کالکشن appointments یافت نشد');
			return;
		}

		// Get full collection details
		const fullCollection = await pb.collections.getOne(appointmentsCol.id);
		
		// Add all required fields
		const updatedFields = [
			...fullCollection.fields,
			{
				name: 'patient',
				type: 'relation',
				required: true,
				presentable: false,
				options: {
					collectionId: usersCol?.id || null,
					cascadeDelete: true,
					minSelect: 1,
					maxSelect: 1
				}
			},
			{
				name: 'doctor',
				type: 'relation',
				required: true,
				presentable: false,
				options: {
					collectionId: doctorsCol?.id || null,
					cascadeDelete: false,
					minSelect: 1,
					maxSelect: 1
				}
			},
			{
				name: 'date_time',
				type: 'date',
				required: true,
				presentable: false
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				presentable: false,
				values: ['pending', 'reserved', 'completed', 'cancelled']
			},
			{
				name: 'type',
				type: 'select',
				required: true,
				presentable: false,
				values: ['in_person', 'online']
			},
			{
				name: 'created',
				type: 'autodate',
				required: true,
				presentable: false,
				onCreate: true,
				onUpdate: false
			},
			{
				name: 'updated',
				type: 'autodate',
				required: true,
				presentable: false,
				onCreate: true,
				onUpdate: true
			}
		];

		// Update collection
		await pb.collections.update(appointmentsCol.id, { fields: updatedFields });
		console.log('✅ فیلدهای appointments با موفقیت اضافه شد');

	} catch (error) {
		console.error('❌ خطا در اصلاح فیلدها:', error);
		if (error.data) {
			console.error('جزئیات خطا:', JSON.stringify(error.data, null, 2));
		}
	}
}

fixAppointmentsFields();