import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase('http://127.0.0.1:8090');

async function checkUsersSchema() {
	try {
		console.log('🔧 بررسی schema کالکشن users...');

		// Login as superuser
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ ورود superuser موفقیت‌آمیز');

		// Get users collection
		const collections = await pb.collections.getList(1, 50, {});
		console.log('📊 تعداد کالکشن‌ها:', collections.totalItems);
		
		const usersCol = collections.items.find(c => c.name === 'users');

		if (usersCol) {
			console.log('✅ کالکشن users یافت شده');
			console.log('🆔 ID:', usersCol.id);
			
			// Get full collection details
			const fullCollection = await pb.collections.getOne(usersCol.id);
			console.log('📊 کالکشن کامل:');
			console.log(JSON.stringify(fullCollection, null, 2));
			
			// Check if role field exists in fields
			if (fullCollection.fields) {
				const roleField = fullCollection.fields.find(f => f.name === 'role');
				if (roleField) {
					console.log('✅ فیلد role وجود دارد:', roleField);
				} else {
					console.log('❌ فیلد role وجود ندارد. در حال اضافه کردن...');
					
					// Add role field to fields
					const updatedFields = [...fullCollection.fields, {
						name: 'role',
						type: 'select',
						required: true,
						options: {
							values: ['admin', 'doctor', 'secretary', 'writer', 'patient'],
							default: 'patient'
						}
					}];
					
					await pb.collections.update(usersCol.id, { fields: updatedFields });
					console.log('✅ فیلد role اضافه شد');
				}
			} else {
				console.log('⚠️  Fields یافت نشد، در حال ایجاد...');
				const newFields = [
					...fullCollection.fields,
					{
						name: 'role',
						type: 'select',
						required: true,
						options: {
							values: ['admin', 'doctor', 'secretary', 'writer', 'patient'],
							default: 'patient'
						}
					}
				];
				await pb.collections.update(usersCol.id, { fields: newFields });
				console.log('✅ Fields جدید ایجاد شد');
			}
		} else {
			console.log('❌ کالکشن users یافت نشد');
		}

	} catch (error) {
		console.error('❌ خطا در بررسی schema:', error);
		if (error.data) {
			console.error('جزئیات خطا:', JSON.stringify(error.data, null, 2));
		}
	}
}

checkUsersSchema();