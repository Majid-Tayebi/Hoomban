import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase('http://127.0.0.1:8090');

async function setupBasicCollections() {
	try {
		console.log('🔧 راه‌اندازی کالکشن‌های پایه...');

		// Login as superuser
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ ورود superuser موفقیت‌آمیز');

		// Get existing collections
		const collections = await pb.collections.getList(1, 50, {});
		const usersCol = collections.items.find(c => c.name === 'users');
		const doctorsCol = collections.items.find(c => c.name === 'doctors');
		const appointmentsCol = collections.items.find(c => c.name === 'appointments');

		// Create doctors collection if doesn't exist
		if (!doctorsCol) {
			console.log('⚠️  کالکشن doctors وجود ندارد، در حال ساخت...');
			await pb.collections.create({
				name: 'doctors',
				type: 'base',
				schema: [
					{
						name: 'user',
						type: 'relation',
						required: true,
						options: {
							collectionId: usersCol?.id || null,
							cascadeDelete: true,
							minSelect: 1,
							maxSelect: 1
						}
					},
					{
						name: 'bio',
						type: 'text',
						required: false,
						options: { max: 1000 }
					},
					{
						name: 'visit_fee',
						type: 'number',
						required: true,
						options: { min: 0 }
					},
					{
						name: 'slot_duration',
						type: 'number',
						required: true,
						options: { min: 15 }
					},
					{
						name: 'availability',
						type: 'json',
						required: false
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
			console.log('✅ کالکشن doctors ساخته شد');
		} else {
			console.log('✅ کالکشن doctors قبلاً وجود دارد');
		}

		// Re-get collections after creating doctors
		const updatedCollections = await pb.collections.getList(1, 50, {});
		const newDoctorsCol = updatedCollections.items.find(c => c.name === 'doctors');
		const newAppointmentsCol = updatedCollections.items.find(c => c.name === 'appointments');

		// Update appointments collection with proper fields
		if (newAppointmentsCol) {
			console.log('⚠️  در حال اصلاح فیلدهای appointments...');
			
			const fullCollection = await pb.collections.getOne(newAppointmentsCol.id);
			
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
						collectionId: newDoctorsCol?.id || null,
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

			await pb.collections.update(newAppointmentsCol.id, { fields: updatedFields });
			console.log('✅ فیلدهای appointments با موفقیت اضافه شد');
		}

		// Update API rules for appointments
		await pb.collections.update('appointments', {
			listRule: '@request.auth.id != ""',
			viewRule: '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.role = "admin" || @request.auth.role = "secretary" || @request.auth.role = "doctor"',
			deleteRule: '@request.auth.role = "admin"'
		});
		console.log('✅ قوانین دسترسی appointments به‌روزرسانی شد');

		console.log('🎉 کالکشن‌های پایه با موفقیت راه‌اندازی شد!');

	} catch (error) {
		console.error('❌ خطا در راه‌اندازی:', error);
		if (error.data) {
			console.error('جزئیات خطا:', JSON.stringify(error.data, null, 2));
		}
	}
}

setupBasicCollections();