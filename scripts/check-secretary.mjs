import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase('http://127.0.0.1:8090');

async function checkSecretary() {
	try {
		console.log('🔧 بررسی اکانت منشی...');

		// Login as superuser
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ ورود superuser موفقیت‌آمیز');

		// Get all users
		const users = await pb.collection('users').getList(1, 50, {});
		console.log(`📊 تعداد کل کاربران: ${users.totalItems}`);

		// Find secretary
		const secretary = users.items.find(u => u.email === 'admin@majid.ir');
		if (secretary) {
			console.log('✅ اکانت منشی یافت شد:');
			console.log('📧 ایمیل:', secretary.email);
			console.log('👤 نام:', secretary.name);
			console.log('🎭 نقش:', secretary.role);
			console.log('🆔 ID:', secretary.id);
		} else {
			console.log('❌ اکانت منشی یافت نشد');
		}

		// Try to login as secretary
		try {
			await pb.collection('users').authWithPassword('admin@majid.ir', 'Admin1234');
			console.log('✅ ورود منشی موفقیت‌آمیز');
			const user = pb.authStore.model;
			console.log('👤 کاربر لاگین شده:', user);
		} catch (error) {
			console.error('❌ خطا در ورود منشی:', error.message);
		}

	} catch (error) {
		console.error('❌ خطا در عملیات:', error);
	}
}

checkSecretary();