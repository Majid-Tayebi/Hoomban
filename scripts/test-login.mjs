import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function testLogin() {
	try {
		console.log('🔧 تست ورود منشی...');

		// Try to login as secretary
		await pb.collection('users').authWithPassword('admin@majid.ir', 'Admin1234');
		console.log('✅ ورود موفقیت‌آمیز');
		
		const user = pb.authStore.model;
		console.log('👤 اطلاعات کاربر:');
		console.log('📧 ایمیل:', user.email);
		console.log('👤 نام:', user.name);
		console.log('🎭 نقش:', user.role);
		console.log('🆔 ID:', user.id);

		// Check if role is correct
		if (user.role === 'secretary') {
			console.log('✅ نقش کاربر صحیح است: secretary');
		} else {
			console.log('❌ نقش کاربر اشتباه است:', user.role);
		}

	} catch (error) {
		console.error('❌ خطا در ورود:', error.message);
		if (error.data) {
			console.error('جزئیات خطا:', JSON.stringify(error.data, null, 2));
		}
	}
}

testLogin();