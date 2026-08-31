import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase('http://127.0.0.1:8090');

async function recreateAppointments() {
	try {
		console.log('🔧 بازسازی کالکشن appointments...');

		// Login as superuser
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ ورود superuser موفقیت‌آمیز');

		// Get collection IDs
		const collections = await pb.collections.getList(1, 50, {});
		const usersCol = collections.items.find(c => c.name === 'users');
		const doctorsCol = collections.items.find(c => c.name === 'doctors');
		const appointmentsCol = collections.items.find(c => c.name === 'appointments');

		// Delete existing appointments collection
		if (appointmentsCol) {
			console.log('⚠️  حذف کالکشن appointments موجود...');
			await pb.collections.delete(appointmentsCol.id);
			console.log('✅ کالکشن appointments حذف شد');
		}

		// Re-get collection IDs after deletion
		const updatedCollections = await pb.collections.getList(1, 50, {});
		const newUsersCol = updatedCollections.items.find(c => c.name === 'users');
		const newDoctorsCol = updatedCollections.items.find(c => c.name === 'doctors');

		// Create new appointments collection
		console.log('⚠️  ساخت کالکشن appointments جدید...');
		const newAppointments = await pb.collections.create({
			name: 'appointments',
			type: 'base',
			schema: [
				{
					name: 'patient',
					type: 'relation',
					required: true,
					options: {
						collectionId: newUsersCol?.id || null,
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
						collectionId: newDoctorsCol?.id || null,
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
		console.log('✅ کالکشن appointments جدید ساخته شد');

		// Set API rules
		await pb.collections.update(newAppointments.id, {
			listRule: '@request.auth.id != ""',
			viewRule: '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.role = "admin" || @request.auth.role = "secretary" || @request.auth.role = "doctor"',
			deleteRule: '@request.auth.role = "admin"'
		});
		console.log('✅ قوانین دسترسی تنظیم شد');

		console.log('🎉 کالکشن appointments با موفقیت بازسازی شد!');

	} catch (error) {
		console.error('❌ خطا در بازسازی:', error);
		if (error.data) {
			console.error('جزئیات خطا:', JSON.stringify(error.data, null, 2));
		}
	}
}

recreateAppointments();