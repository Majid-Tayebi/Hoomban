import PocketBase from 'pocketbase';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Superuser credentials from environment variables
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
	console.error('❌ متغیرهای محیطی POCKETBASE_ADMIN_EMAIL و POCKETBASE_ADMIN_PASSWORD در فایل .env.local تعریف نشده‌اند');
	process.exit(1);
}

const pb = new PocketBase('http://127.0.0.1:8090');

async function setupQuizSystem() {
	try {
		console.log('🔧 شروع راه‌اندازی سیستم تست‌های روانشناسی...');

		// Login as superuser or create if doesn't exist
		try {
			await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
			console.log('✅ ورود superuser موفقیت‌آمیز');
		} catch (error) {
			console.log('⚠️  Superuser وجود ندارد، در حال ساخت...');
			try {
				await pb.admins.create({
					email: ADMIN_EMAIL,
					password: ADMIN_PASSWORD,
					passwordConfirm: ADMIN_PASSWORD
				});
				console.log('✅ Superuser جدید ساخته شد');
				await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
				console.log('✅ ورود superuser موفقیت‌آمیز');
			} catch (createError) {
				console.error('❌ خطا در ساخت Superuser:', createError.message);
				console.log('⚠️  لطفاً اعتبارنامه‌های Superuser را در بالای اسکریپت بررسی کنید:');
				console.log(`   EMAIL: ${ADMIN_EMAIL}`);
				console.log(`   PASSWORD: ${ADMIN_PASSWORD}`);
				return;
			}
		}

		// Create psych_tests collection
		try {
			const psychTests = await pb.collections.create({
				name: 'psych_tests',
				type: 'base',
				schema: [
					{
						name: 'title',
						type: 'text',
						required: true,
						options: { min: 1, max: 200 }
					},
					{
						name: 'slug',
						type: 'text',
						required: true,
						unique: true,
						options: { min: 1, max: 100, pattern: '^[a-z0-9-]+$' }
					},
					{
						name: 'description',
						type: 'editor',
						required: false
					},
					{
						name: 'category',
						type: 'select',
						required: true,
						options: { values: ['personality', 'depression', 'marriage', 'kids'] }
					},
					{
						name: 'is_active',
						type: 'bool',
						required: true,
						options: { default: true }
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
			console.log('✅ کالکشن psych_tests ساخته شد');
		} catch (error) {
			if (error.status === 400 && error.data?.title?.includes('already exists')) {
				console.log('⚠️  کالکشن psych_tests قبلاً وجود دارد');
			} else {
				console.error('❌ خطا در ساخت psych_tests:', error.message);
			}
		}

		// Create psych_questions collection
		try {
			const psychQuestions = await pb.collections.create({
				name: 'psych_questions',
				type: 'base',
				schema: [
					{
						name: 'test',
						type: 'relation',
						required: true,
						options: {
							collectionId: null,
							cascadeDelete: true,
							minSelect: 1,
							maxSelect: 1
						}
					},
					{
						name: 'question_text',
						type: 'text',
						required: true,
						options: { min: 1, max: 1000 }
					},
					{
						name: 'order',
						type: 'number',
						required: true,
						options: { min: 0 }
					},
					{
						name: 'options_json',
						type: 'json',
						required: true
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
			console.log('✅ کالکشن psych_questions ساخته شد');
		} catch (error) {
			if (error.status === 400 && error.data?.title?.includes('already exists')) {
				console.log('⚠️  کالکشن psych_questions قبلاً وجود دارد');
			} else {
				console.error('❌ خطا در ساخت psych_questions:', error.message);
			}
		}

		// Create psych_results collection
		try {
			const psychResults = await pb.collections.create({
				name: 'psych_results',
				type: 'base',
				schema: [
					{
						name: 'user',
						type: 'relation',
						required: true,
						options: {
							collectionId: null,
							cascadeDelete: true,
							minSelect: 1,
							maxSelect: 1
						}
					},
					{
						name: 'test',
						type: 'relation',
						required: true,
						options: {
							collectionId: null,
							cascadeDelete: false,
							minSelect: 1,
							maxSelect: 1
						}
					},
					{
						name: 'answers_json',
						type: 'json',
						required: true
					},
					{
						name: 'scores_json',
						type: 'json',
						required: true
					},
					{
						name: 'interpretation_text',
						type: 'text',
						required: true,
						options: { min: 1, max: 5000 }
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
			console.log('✅ کالکشن psych_results ساخته شد');
		} catch (error) {
			if (error.status === 400 && error.data?.title?.includes('already exists')) {
				console.log('⚠️  کالکشن psych_results قبلاً وجود دارد');
			} else {
				console.error('❌ خطا در ساخت psych_results:', error.message);
			}
		}

		// Get collection IDs for relations
		const collections = await pb.collections.getList(1, 50, {});
		const psychTestsCol = collections.items.find(c => c.name === 'psych_tests');
		const usersCol = collections.items.find(c => c.name === 'users');

		if (psychTestsCol && usersCol) {
			// Update psych_questions relation
			try {
				const questionsCol = collections.items.find(c => c.name === 'psych_questions');
				if (questionsCol) {
					const updatedSchema = questionsCol.schema.map(field => {
						if (field.name === 'test') {
							return {
								...field,
								options: {
									...field.options,
									collectionId: psychTestsCol.id
								}
							};
						}
						return field;
					});
					await pb.collections.update(questionsCol.id, { schema: updatedSchema });
					console.log('✅ Relation psych_questions -> psych_tests به‌روزرسانی شد');
				}
			} catch (error) {
				console.error('❌ خطا در به‌روزرسانی relation psych_questions:', error.message);
			}

			// Update psych_results relations
			try {
				const resultsCol = collections.items.find(c => c.name === 'psych_results');
				if (resultsCol) {
					const updatedSchema = resultsCol.schema.map(field => {
						if (field.name === 'user') {
							return {
								...field,
								options: {
									...field.options,
									collectionId: usersCol.id
								}
							};
						}
						if (field.name === 'test') {
							return {
								...field,
								options: {
									...field.options,
									collectionId: psychTestsCol.id
								}
							};
						}
						return field;
					});
					await pb.collections.update(resultsCol.id, { schema: updatedSchema });
					console.log('✅ Relations psych_results به‌روزرسانی شد');
				}
			} catch (error) {
				console.error('❌ خطا در به‌روزرسانی relations psych_results:', error.message);
			}
		}

		// Set API rules for psych_tests
		try {
			await pb.collections.update('psych_tests', {
				listRule: '@request.auth.id != "" && is_active = true',
				viewRule: '@request.auth.id != "" && is_active = true',
				createRule: '@request.auth.role = "admin" || @request.auth.role = "writer"',
				updateRule: '@request.auth.role = "admin" || @request.auth.role = "writer"',
				deleteRule: '@request.auth.role = "admin"'
			});
			console.log('✅ قوانین دسترسی psych_tests تنظیم شد');
		} catch (error) {
			console.error('❌ خطا در تنظیم قوانین psych_tests:', error.message);
		}

		// Set API rules for psych_questions
		try {
			await pb.collections.update('psych_questions', {
				listRule: '@request.auth.id != ""',
				viewRule: '@request.auth.id != ""',
				createRule: '@request.auth.role = "admin" || @request.auth.role = "writer"',
				updateRule: '@request.auth.role = "admin" || @request.auth.role = "writer"',
				deleteRule: '@request.auth.role = "admin"'
			});
			console.log('✅ قوانین دسترسی psych_questions تنظیم شد');
		} catch (error) {
			console.error('❌ خطا در تنظیم قوانین psych_questions:', error.message);
		}

		// Set API rules for psych_results
		try {
			await pb.collections.update('psych_results', {
				listRule: '@request.auth.id != "" && user = @request.auth.id',
				viewRule: '@request.auth.id != "" && user = @request.auth.id',
				createRule: '@request.auth.id != ""',
				updateRule: '@request.auth.role = "admin" || @request.auth.role = "doctor"',
				deleteRule: '@request.auth.role = "admin"'
			});
			console.log('✅ قوانین دسترسی psych_results تنظیم شد');
		} catch (error) {
			console.error('❌ خطا در تنظیم قوانین psych_results:', error.message);
		}

		// Create sample test (Depression Test)
		try {
			console.log('📝 در حال ساخت تست نمونه...');
			
			const sampleTest = await pb.collection('psych_tests').create({
				title: 'تست افسردگی بک',
				slug: 'beck-depression-test',
				description: 'این تست برای ارزیابی سطح افسردگی استفاده می‌شود.',
				category: 'depression',
				is_active: true
			});
			console.log('✅ تست نمونه ساخته شد:', sampleTest.title);

			// Create sample questions
			const questions = [
				{
					question_text: 'آیا احساس غم و ناراحتی دارید؟',
					order: 1,
					options_json: JSON.stringify([
						{ text: 'اصلاً', scores: { depression: 0 } },
						{ text: 'کمی', scores: { depression: 1 } },
						{ text: 'متوسط', scores: { depression: 2 } },
						{ text: 'زیاد', scores: { depression: 3 } }
					])
				},
				{
					question_text: 'آیا از فعالیت‌های روزانه لذت می‌برید؟',
					order: 2,
					options_json: JSON.stringify([
						{ text: 'بله، کاملاً', scores: { depression: 0 } },
						{ text: 'کمی', scores: { depression: 1 } },
						{ text: 'کمتر', scores: { depression: 2 } },
						{ text: 'اصلاً', scores: { depression: 3 } }
					])
				},
				{
					question_text: 'آیا احساس خستگی دارید؟',
					order: 3,
					options_json: JSON.stringify([
						{ text: 'اصلاً', scores: { depression: 0 } },
						{ text: 'کمی', scores: { depression: 1 } },
						{ text: 'متوسط', scores: { depression: 2 } },
						{ text: 'زیاد', scores: { depression: 3 } }
					])
				},
				{
					question_text: 'آیا احساس بی‌ارزشی دارید؟',
					order: 4,
					options_json: JSON.stringify([
						{ text: 'اصلاً', scores: { depression: 0 } },
						{ text: 'کمی', scores: { depression: 1 } },
						{ text: 'متوسط', scores: { depression: 2 } },
						{ text: 'زیاد', scores: { depression: 3 } }
					])
				},
				{
					question_text: 'آیا تمرکز کردن برایتان دشوار است؟',
					order: 5,
					options_json: JSON.stringify([
						{ text: 'اصلاً', scores: { depression: 0 } },
						{ text: 'کمی', scores: { depression: 1 } },
						{ text: 'متوسط', scores: { depression: 2 } },
						{ text: 'زیاد', scores: { depression: 3 } }
					])
				}
			];

			for (const q of questions) {
				await pb.collection('psych_questions').create({
					test: sampleTest.id,
					...q
				});
			}
			console.log('✅ ۵ سوال نمونه ساخته شد');

		} catch (error) {
			console.error('❌ خطا در ساخت تست نمونه:', error.message);
		}

		console.log('🎉 سیستم تست‌های روانشناسی با موفقیت راه‌اندازی شد!');
		console.log('📝 تست نمونه: beck-depression-test');
		console.log('🔗 می‌توانید از مسیر /tests/beck-depression-test به تست دسترسی داشته باشید');

	} catch (error) {
		console.error('❌ خطا در راه‌اندازی سیستم:', error);
	}
}

setupQuizSystem();