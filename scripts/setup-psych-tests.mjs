import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function setupPsychTestsCollections() {
	try {
		console.log('🔧 شروع تنظیم کالکشن‌های تست‌های روانشناسی...');

		// Login as superuser via admin API
		try {
			await pb.admins.authWithPassword('admin@hoomban.com', 'Admin123!');
			console.log('✅ ورود superuser موفقیت‌آمیز');
		} catch (error) {
			console.log('⚠️  superuser وجود ندارد، در حال ساخت...');
			try {
				await pb.admins.create({
					email: 'admin@hoomban.com',
					password: 'Admin123!',
					passwordConfirm: 'Admin123!'
				});
				console.log('✅ superuser جدید ساخته شد');
				await pb.admins.authWithPassword('admin@hoomban.com', 'Admin123!');
				console.log('✅ ورود superuser موفقیت‌آمیز');
			} catch (createError) {
				console.error('❌ خطا در ساخت superuser:', createError);
				console.log('⚠️  لطفاً superuser را دستی بسازید و دوباره تلاش کنید');
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
						options: {
							min: 1,
							max: 200
						}
					},
					{
						name: 'slug',
						type: 'text',
						required: true,
						unique: true,
						options: {
							min: 1,
							max: 100,
							pattern: '^[a-z0-9-]+$'
						}
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
						options: {
							values: ['personality', 'depression', 'marriage', 'children', 'anxiety', 'other']
						}
					},
					{
						name: 'is_active',
						type: 'bool',
						required: true,
						options: {
							default: true
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
			console.log('✅ کالکشن psych_tests ساخته شد');
		} catch (error) {
			if (error.status === 400 && error.data?.title?.includes('already exists')) {
				console.log('⚠️  کالکشن psych_tests قبلاً وجود دارد');
			} else {
				console.error('❌ خطا در ساخت psych_tests:', error);
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
							collectionId: null, // Will be set after psych_tests is created
							cascadeDelete: true,
							minSelect: 1,
							maxSelect: 1
						}
					},
					{
						name: 'question_text',
						type: 'text',
						required: true,
						options: {
							min: 1,
							max: 1000
						}
					},
					{
						name: 'order',
						type: 'number',
						required: true,
						options: {
							min: 0
						}
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
				console.error('❌ خطا در ساخت psych_questions:', error);
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
							collectionId: null, // Will be set to users collection
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
							collectionId: null, // Will be set after psych_tests is created
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
						options: {
							min: 1,
							max: 5000
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
			console.log('✅ کالکشن psych_results ساخته شد');
		} catch (error) {
			if (error.status === 400 && error.data?.title?.includes('already exists')) {
				console.log('⚠️  کالکشن psych_results قبلاً وجود دارد');
			} else {
				console.error('❌ خطا در ساخت psych_results:', error);
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
				console.error('❌ خطا در به‌روزرسانی relation psych_questions:', error);
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
				console.error('❌ خطا در به‌روزرسانی relations psych_results:', error);
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
			console.error('❌ خطا در تنظیم قوانین psych_tests:', error);
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
			console.error('❌ خطا در تنظیم قوانین psych_questions:', error);
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
			console.error('❌ خطا در تنظیم قوانین psych_results:', error);
		}

		console.log('🎉 سیستم تست‌های روانشناسی با موفقیت راه‌اندازی شد!');
	} catch (error) {
		console.error('❌ خطا در راه‌اندازی سیستم:', error);
	}
}

setupPsychTestsCollections();