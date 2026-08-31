import PocketBase from 'pocketbase';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase('http://127.0.0.1:8090');

async function createSecretary() {
	try {
		console.log('🔧 شروع ساخت اکانت منشی...');

		// Login as superuser
		try {
			await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
			console.log('✅ ورود superuser موفقیت‌آمیز');
		} catch (error) {
			console.error('❌ خطا در ورود superuser:', error.message);
			return;
		}

		// Create secretary user
		try {
			const result = await pb.collection('users').create({
				email: 'admin@majid.ir',
				password: 'Admin1234',
				passwordConfirm: 'Admin1234',
				name: 'منشی',
				role: 'secretary'
			});
			console.log('✅ اکانت منشی با موفقیت ساخته شد');
			console.log('📧 ایمیل: admin@majid.ir');
			console.log('🔑 رمز عبور: Admin1234');
			console.log('👤 نقش: secretary');
			console.log('🆔 ID:', result.id);
		} catch (error) {
			console.error('❌ خطا در ساخت اکانت:', error);
			if (error.data) {
				console.error('جزئیات خطا:', JSON.stringify(error.data, null, 2));
			}
		}

	} catch (error) {
		console.error('❌ خطا در عملیات:', error);
	}
}

createSecretary();