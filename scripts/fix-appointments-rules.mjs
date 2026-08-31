import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase('http://127.0.0.1:8090');

async function fixAppointmentsRules() {
	try {
		console.log('🔧 اصلاح قوانین دسترسی appointments...');

		// Login as superuser
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ ورود superuser موفقیت‌آمیز');

		// Update appointments API rules
		await pb.collections.update('appointments', {
			listRule: '@request.auth.id != ""',
			viewRule: '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.role = "admin" || @request.auth.role = "secretary" || @request.auth.role = "doctor"',
			deleteRule: '@request.auth.role = "admin"'
		});
		console.log('✅ قوانین دسترسی appointments به‌روزرسانی شد');

	} catch (error) {
		console.error('❌ خطا در اصلاح قوانین:', error);
		if (error.data) {
			console.error('جزئیات خطا:', JSON.stringify(error.data, null, 2));
		}
	}
}

fixAppointmentsRules();