import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase('http://127.0.0.1:8090');

async function addRoleField() {
	try {
		console.log('🔧 اضافه کردن فیلد role به کالکشن users...');

		// Login as superuser
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ ورود superuser موفقیت‌آمیز');

		// Get users collection
		const collections = await pb.collections.getList(1, 50, {});
		const usersCol = collections.items.find(c => c.name === 'users');

		if (!usersCol) {
			console.error('❌ کالکشن users یافت نشد');
			return;
		}

		console.log('✅ کالکشن users یافت شد');

		// Get full collection details
		const fullCollection = await pb.collections.getOne(usersCol.id);
		
		// Check if role field already exists
		const roleField = fullCollection.fields.find(f => f.name === 'role');
		if (roleField) {
			console.log('✅ فیلد role قبلاً وجود دارد');
			return;
		}

		console.log('⚠️  فیلد role وجود ندارد، در حال اضافه کردن...');

		// Add role field to fields array
		const updatedFields = [...fullCollection.fields, {
			name: 'role',
			type: 'text',
			required: false,
			presentable: false,
			max: 20,
			default: 'patient'
		}];

		// Update collection
		await pb.collections.update(usersCol.id, { fields: updatedFields });
		console.log('✅ فیلد role با موفقیت اضافه شد');

		// Update the secretary user's role
		try {
			await pb.collection('users').update('15620v9yol1x06x', {
				role: 'secretary'
			});
			console.log('✅ نقش منشی به secretary به‌روزرسانی شد');
		} catch (error) {
			console.error('❌ خطا در به‌روزرسانی نقش منشی:', error.message);
		}

		// Verify
		const user = await pb.collection('users').getOne('15620v9yol1x06x');
		console.log('👤 کاربر نهایی:');
		console.log('📧 ایمیل:', user.email);
		console.log('🎭 نقش:', user.role);

	} catch (error) {
		console.error('❌ خطا در عملیات:', error);
		if (error.data) {
			console.error('جزئیات خطا:', JSON.stringify(error.data, null, 2));
		}
	}
}

addRoleField();