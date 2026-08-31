/**
 * اسکریپت راه‌اندازی سیستم نقش‌محور (RBAC) برای PocketBase
 * این اسکریپت دسترسی‌های API Rules را برای کالکشن users تنظیم می‌کند
 */

const PB_URL = 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = 'admin@hoomban.com';
const PB_ADMIN_PASSWORD = 'admin123';

const PocketBase = require('pocketbase');

async function setupRBAC() {
	const pb = new PocketBase(PB_URL);

	try {
		// ورود به عنوان admin
		await pb.admins.create({
			email: PB_ADMIN_EMAIL,
			password: PB_ADMIN_PASSWORD,
			passwordConfirm: PB_ADMIN_PASSWORD
		});
		console.log('Admin ایجاد شد');
	} catch (error) {
		console.log('Admin قبلاً وجود دارد، ورود...');
	}

	try {
		await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
		console.log('ورود admin موفقیت‌آمیز');
	} catch (error) {
		console.error('خطا در ورود admin:', error);
		return;
	}

	// تنظیمات دسترسی‌ها برای کالکشن users
	const usersCollectionRules = {
		// قوانین دسترسی برای خواندن
		// کاربران لاگین‌شده می‌توانند اطلاعات عمومی را ببینند
		'@request.auth.id != ""': {
			'read': true,
			'update': true,
			'delete': false
		},
		// دسترسی‌های admin
		'id = @request.auth.id && @request.auth.role = "admin"': {
			'create': true,
			'update': true,
			'delete': true
		}
	};

	try {
		// دریافت کالکشن users
		const usersCollection = await pb.collections.get('users');
		
		// به‌روزرسانی قوانین دسترسی
		usersCollection.rules = JSON.stringify(usersCollectionRules);
		
		// ذخیره تغییرات
		await pb.collections.update(usersCollection.id, usersCollection);
		
		console.log('قوانین دسترسی users با موفقیت تنظیم شد');
	} catch (error) {
		console.error('خطا در تنظیم قوانین دسترسی:', error);
	}

	// تنظیمات دسترسی‌ها برای کالکشن appointments
	const appointmentsCollectionRules = {
		// همه کاربران لاگین‌شده می‌توانند نوبت‌ها را ببینند
		'@request.auth.id != ""': {
			'read': true
		},
		// secretary و admin می‌توانند نوبت‌ها را مدیریت کنند
		'@request.auth.id != "" && (@request.auth.role = "secretary" || @request.auth.role = "admin")': {
			'create': true,
			'update': true,
			'delete': true
		},
		// doctor می‌تواند نوبت‌های خود را ببیند و آپدیت کند
		'@request.auth.id != "" && @request.auth.role = "doctor"': {
			'read': true,
			'update': true
		}
	};

	try {
		const appointmentsCollection = await pb.collections.get('appointments');
		appointmentsCollection.rules = JSON.stringify(appointmentsCollectionRules);
		await pb.collections.update(appointmentsCollection.id, appointmentsCollection);
		console.log('قوانین دسترسی appointments با موفقیت تنظیم شد');
	} catch (error) {
		console.error('خطا در تنظیم قوانین دسترسی appointments:', error);
	}

	// تنظیمات دسترسی‌ها برای کالکشن doctors
	const doctorsCollectionRules = {
		// همه کاربران لاگین‌شده می‌توانند روانشناسان را ببینند
		'@request.auth.id != ""': {
			'read': true
		},
		// doctor می‌تواند اطلاعات خود را آپدیت کند
		'@request.auth.id != "" && @request.auth.role = "doctor"': {
			'update': true
		},
		// admin می‌تواند همه را مدیریت کند
		'@request.auth.id != "" && @request.auth.role = "admin"': {
			'create': true,
			'update': true,
			'delete': true
		}
	};

	try {
		const doctorsCollection = await pb.collections.get('doctors');
		doctorsCollection.rules = JSON.stringify(doctorsCollectionRules);
		await pb.collections.update(doctorsCollection.id, doctorsCollection);
		console.log('قوانین دسترسی doctors با موفقیت تنظیم شد');
	} catch (error) {
		console.error('خطا در تنظیم قوانین دسترسی doctors:', error);
	}

	console.log('✅ سیستم RBAC با موفقیت راه‌اندازی شد');
}

setupRBAC().catch(console.error);