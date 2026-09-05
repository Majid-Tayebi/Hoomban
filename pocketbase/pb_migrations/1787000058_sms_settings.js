/// <reference path="../pb_data/types.d.ts" />

/**
 * Server-only SMS.ir settings (API key, line number, verified template IDs).
 * All ACL null — access only via getAdminPb in SvelteKit.
 */
migrate((app) => {
	const pkField = (id) => ({
		id,
		name: 'id',
		type: 'text',
		primaryKey: true,
		required: true,
		autogeneratePattern: '[a-z0-9]{15}',
		min: 15,
		max: 15,
		pattern: '^[a-z0-9]+$'
	});

	let col;
	try {
		col = app.findCollectionByNameOrId('sms_settings');
	} catch {
		col = new Collection({
			id: 'pbc_sms_settings',
			name: 'sms_settings',
			type: 'base',
			listRule: null,
			viewRule: null,
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [pkField('text_sms_settings_id')]
		});
		app.save(col);
		col = app.findCollectionByNameOrId('sms_settings');
	}

	const addField = (def) => {
		if (!col.fields.getByName(def.name)) {
			col.fields.add(new Field(def));
		}
	};

	addField({
		id: 'text_sms_settings_key',
		name: 'key',
		type: 'text',
		required: true,
		max: 40
	});
	addField({
		id: 'text_sms_api_key',
		name: 'api_key',
		type: 'text',
		required: false,
		max: 200
	});
	addField({
		id: 'text_sms_line_number',
		name: 'line_number',
		type: 'text',
		required: false,
		max: 40
	});
	addField({
		id: 'text_sms_otp_template_id',
		name: 'otp_template_id',
		type: 'text',
		required: false,
		max: 40
	});
	addField({
		id: 'text_sms_otp_param',
		name: 'otp_param',
		type: 'text',
		required: false,
		max: 40
	});
	addField({
		id: 'text_tpl_appt_confirmed_patient',
		name: 'tpl_appt_confirmed_patient',
		type: 'text',
		required: false,
		max: 40
	});
	addField({
		id: 'text_tpl_appt_confirmed_doctor',
		name: 'tpl_appt_confirmed_doctor',
		type: 'text',
		required: false,
		max: 40
	});
	addField({
		id: 'text_tpl_appt_cancelled_patient',
		name: 'tpl_appt_cancelled_patient',
		type: 'text',
		required: false,
		max: 40
	});
	addField({
		id: 'text_tpl_appt_rescheduled_patient',
		name: 'tpl_appt_rescheduled_patient',
		type: 'text',
		required: false,
		max: 40
	});
	addField({
		id: 'text_tpl_appt_rescheduled_doctor',
		name: 'tpl_appt_rescheduled_doctor',
		type: 'text',
		required: false,
		max: 40
	});
	addField({
		id: 'text_tpl_appt_reminder_patient',
		name: 'tpl_appt_reminder_patient',
		type: 'text',
		required: false,
		max: 40
	});
	addField({
		id: 'text_tpl_appt_reminder_doctor',
		name: 'tpl_appt_reminder_doctor',
		type: 'text',
		required: false,
		max: 40
	});

	app.save(col);

	col = app.findCollectionByNameOrId('sms_settings');
	col.listRule = null;
	col.viewRule = null;
	col.createRule = null;
	col.updateRule = null;
	col.deleteRule = null;
	app.save(col);

	const keyIndex = 'CREATE UNIQUE INDEX IF NOT EXISTS `idx_sms_settings_key` ON `sms_settings` (`key`)';
	try {
		app.db().newQuery(keyIndex).execute();
	} catch {
		/* index may already exist */
	}

	try {
		app.findFirstRecordByFilter('sms_settings', 'key = "main"');
	} catch {
		const record = new Record(col);
		record.set('key', 'main');
		record.set('otp_param', 'CODE');
		app.save(record);
	}
}, (app) => {
	try {
		const col = app.findCollectionByNameOrId('sms_settings');
		app.delete(col);
	} catch {
		/* ignore */
	}
});
