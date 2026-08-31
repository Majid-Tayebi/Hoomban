import PocketBase from 'pocketbase';

async function setupCollections() {
  console.log('=== تنظیم کالکشن‌های سامانه مدیریت کلینیک روانشناسی ===\n');

  const adminEmail = 'admin@hoomban.com';
  const adminPassword = 'admin123';

  const pb = new PocketBase('http://127.0.0.1:8090');

  try {
    // لاگین به عنوان ادمین
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ لاگین ادمین موفقیت‌آمیز بود\n');

    // 1. بروزرسانی کالکشن users
    console.log('📝 در حال بروزرسانی کالکشن users...');
    try {
      const usersCollection = await pb.collections.getOne('_pb_users_auth_');
      
      // اضافه کردن فیلدهای جدید
      const updatedSchema = Array.isArray(usersCollection.schema) ? [...usersCollection.schema] : [];
      
      // چک کردن اینکه فیلدها قبلاً اضافه نشده باشند
      if (!updatedSchema.some(field => field.name === 'role')) {
        updatedSchema.push({
          name: 'role',
          type: 'select',
          required: true,
          options: {
            values: ['patient', 'doctor', 'secretary', 'admin'],
            maxSelect: 1
          }
        });
      }
      
      if (!updatedSchema.some(field => field.name === 'mobile')) {
        updatedSchema.push({
          name: 'mobile',
          type: 'text',
          required: false,
          options: {
            min: 10,
            max: 15,
            pattern: ''
          }
        });
      }

      await pb.collections.update('_pb_users_auth_', {
        schema: updatedSchema
      });
      console.log('✅ کالکشن users بروزرسانی شد\n');
    } catch (error) {
      console.log('⚠️ کالکشن users قبلاً بروزرسانی شده یا خطا رخ داده است:', error.message);
    }

    // 2. ایجاد کالکشن doctors (اگر وجود ندارد)
    console.log('📝 در حال بررسی کالکشن doctors...');
    try {
      const doctorsCollection = await pb.collections.create({
        name: 'doctors',
        type: 'base',
        schema: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            options: {
              collectionId: '_pb_users_auth_',
              cascadeDelete: false,
              minSelect: 1,
              maxSelect: 1
            }
          },
          {
            name: 'bio',
            type: 'editor',
            required: false,
            options: {
              convertUrls: true
            }
          },
          {
            name: 'visit_fee',
            type: 'number',
            required: true,
            options: {
              min: 0,
              max: null
            }
          },
          {
            name: 'working_days',
            type: 'json',
            required: true,
            options: {}
          },
          {
            name: 'slot_duration',
            type: 'number',
            required: true,
            options: {
              min: 15,
              max: 180
            }
          }
        ]
      });
      console.log('✅ کالکشن doctors ایجاد شد\n');
    } catch (error) {
      console.log('⚠️ کالکشن doctors قبلاً ایجاد شده است\n');
    }

    // 3. ایجاد کالکشن appointments (اگر وجود ندارد)
    console.log('📝 در حال بررسی کالکشن appointments...');
    try {
      const doctorsList = await pb.collections.getList(1, 1, {
        filter: 'name = "doctors"'
      });
      const doctorsCollection = doctorsList.items[0];

      const appointmentsCollection = await pb.collections.create({
        name: 'appointments',
        type: 'base',
        schema: [
          {
            name: 'patient',
            type: 'relation',
            required: true,
            options: {
              collectionId: '_pb_users_auth_',
              cascadeDelete: false,
              minSelect: 1,
              maxSelect: 1
            }
          },
          {
            name: 'doctor',
            type: 'relation',
            required: true,
            options: {
              collectionId: doctorsCollection.id,
              cascadeDelete: false,
              minSelect: 1,
              maxSelect: 1
            }
          },
          {
            name: 'date_time',
            type: 'date',
            required: true,
            options: {}
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            options: {
              values: ['reserved', 'completed', 'cancelled', 'pending'],
              maxSelect: 1
            }
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            options: {
              values: ['online', 'in_person'],
              maxSelect: 1
            }
          }
        ]
      });
      console.log('✅ کالکشن appointments ایجاد شد\n');
    } catch (error) {
      console.log('⚠️ کالکشن appointments قبلاً ایجاد شده است\n');
    }

    // 4. ایجاد کالکشن services (اگر وجود ندارد)
    console.log('📝 در حال بررسی کالکشن services...');
    try {
      const servicesCollection = await pb.collections.create({
        name: 'services',
        type: 'base',
        schema: [
          {
            name: 'title',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 200,
              pattern: ''
            }
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            options: {
              values: ['test', 'device', 'other'],
              maxSelect: 1
            }
          },
          {
            name: 'price',
            type: 'number',
            required: true,
            options: {
              min: 0,
              max: null
            }
          },
          {
            name: 'is_active',
            type: 'bool',
            required: true,
            options: {}
          }
        ]
      });
      console.log('✅ کالکشن services ایجاد شد\n');
    } catch (error) {
      console.log('⚠️ کالکشن services قبلاً ایجاد شده است\n');
    }

    // 5. ایجاد کالکشن transactions (اگر وجود ندارد)
    console.log('📝 در حال بررسی کالکشن transactions...');
    try {
      const doctorsList = await pb.collections.getList(1, 1, {
        filter: 'name = "doctors"'
      });
      const doctorsCollection = doctorsList.items[0];

      const transactionsCollection = await pb.collections.create({
        name: 'transactions',
        type: 'base',
        schema: [
          {
            name: 'patient',
            type: 'relation',
            required: false,
            options: {
              collectionId: '_pb_users_auth_',
              cascadeDelete: false,
              minSelect: 1,
              maxSelect: 1
            }
          },
          {
            name: 'doctor',
            type: 'relation',
            required: false,
            options: {
              collectionId: doctorsCollection.id,
              cascadeDelete: false,
              minSelect: 1,
              maxSelect: 1
            }
          },
          {
            name: 'amount',
            type: 'number',
            required: true,
            options: {
              min: 0,
              max: null
            }
          },
          {
            name: 'payment_method',
            type: 'select',
            required: true,
            options: {
              values: ['gateway', 'pos', 'card_to_card', 'cash'],
              maxSelect: 1
            }
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            options: {
              values: ['paid', 'unpaid', 'refunded'],
              maxSelect: 1
            }
          },
          {
            name: 'created_by',
            type: 'select',
            required: true,
            options: {
              values: ['system', 'secretary'],
              maxSelect: 1
            }
          },
          {
            name: 'description',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: 1000,
              pattern: ''
            }
          }
        ]
      });
      console.log('✅ کالکشن transactions ایجاد شد\n');
    } catch (error) {
      console.log('⚠️ کالکشن transactions قبلاً ایجاد شده است\n');
    }

    console.log('🎉 تمام کالکشن‌ها با موفقیت ایجاد شدند!');

  } catch (error) {
    console.error('❌ خطا در ایجاد کالکشن‌ها:', error.message);
    console.error(error);
  }
}

setupCollections();
