import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase('http://127.0.0.1:8090');

async function checkAppointments() {
	try {
		console.log('🔧 بررسی کالکشن appointments...');

		// Login as superuser
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ ورود superuser موفقیت‌آمیز');

		// Get all collections
		const collections = await pb.collections.getList(1, 50, {});
		const appointmentsCol = collections.items.find(c => c.name === 'appointments');

		if (appointmentsCol) {
			console.log('✅ کالکشن appointments وجود دارد');
			console.log('🆔 ID:', appointmentsCol.id);
			
			// Get full collection details
			const fullCollection = await pb.collections.getOne(appointmentsCol.id);
			console.log('📊 جزئیات کالکشن:');
			console.log(JSON.stringify(fullCollection, null, 2));
		} else {
			console.log('❌ کالکشن appointments وجود ندارد');
			console.log('در حال ساخت کالکشن appointments...');
			
			// Create appointments collection
			const appointments = await pb.collections.create({
				name: 'appointments',
				type: 'base',
				schema: [
					{
						name: 'patient',
						type: 'relation',
						required: true,
						options: {
							collectionId: null, // Will be set to users
							cascadeDelete: true,
							minSelect: 1,
							maxSelect: 1
						}
					},
					{
						name: 'doctor',
						type: 'relation',
						required: true,
						options: {
							collectionId: null, // Will be set to doctors
							cascadeDelete: false,
							minSelect: 1,
							maxSelect: 1
						}
					},
					{
						name: 'date_time',
						type: 'date',
						required: true
					},
					{
						name: 'status',
						type: 'select',
						required: true,
						options: {
							values: ['pending', 'reserved', 'completed', 'cancelled']
						}
					},
					{
						name: 'type',
						type: 'select',
						required: true,
						options: {
							values: ['in_person', 'online']
						}
					},
					{
						name: 'created',
						type: 'autodate',
						required: true
					},
					{
						name: 'updated',
						type: 'autodate',
						required: true
					}
				]
			});
			console.log('✅ کالکشن appointments ساخته شد');
		}

	} catch (error) {
		console.error('❌ خطا در بررسی کالکشن:', error);
		if (error.data) {
			console.error('جزئیات خطا:', JSON.stringify(error.data, null, 2));
		}
	}
}

checkAppointments();