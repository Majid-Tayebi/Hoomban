import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase('http://127.0.0.1:8090');

async function fixSecretaryRole() {
	try {
		console.log('🔧 اصلاح نقش منشی...');

		// Login as superuser
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ ورود superuser موفقیت‌آمیز');

		// Update secretary role
		await pb.collection('users').update('15620v9yol1x06x', {
			role: 'secretary'
		});
		console.log('✅ نقش منشی به secretary به‌روزرسانی شد');

		// Verify
		const user = await pb.collection('users').getOne('15620v9yol1x06x');
		console.log('👤 کاربر به‌روزرسانی شده:');
		console.log('📧 ایمیل:', user.email);
		console.log('🎭 نقش:', user.role);

	} catch (error) {
		console.error('❌ خطا در اصلاح نقش:', error);
		if (error.data) {
			console.error('جزئیات خطا:', JSON.stringify(error.data, null, 2));
		}
	}
}

fixSecretaryRole();