/// <reference path="../pb_data/types.d.ts" />

/** Patient file attachments (photos, scans, prior records) — doctor + admin only. */
migrate((app) => {
	const noteAccess =
		"@request.auth.role = 'admin' || (@request.auth.role = 'doctor' && doctor.user = @request.auth.id)";

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

	let attachments;
	try {
		attachments = app.findCollectionByNameOrId('patient_attachments');
	} catch {
		attachments = new Collection({
			id: 'pbc_patient_attachments',
			name: 'patient_attachments',
			type: 'base',
			listRule: null,
			viewRule: null,
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [pkField('text_pa_id')]
		});
		app.save(attachments);
		attachments = app.findCollectionByNameOrId('patient_attachments');
	}

	const addField = (def) => {
		if (!attachments.fields.getByName(def.name)) {
			attachments.fields.add(new Field(def));
		}
	};

	addField({
		id: 'rel_pa_patient',
		name: 'patient',
		type: 'relation',
		required: true,
		collectionId: '_pb_users_auth_',
		cascadeDelete: true,
		maxSelect: 1
	});
	addField({
		id: 'rel_pa_doctor',
		name: 'doctor',
		type: 'relation',
		required: true,
		collectionId: 'pbc_656799828',
		cascadeDelete: false,
		maxSelect: 1
	});
	addField({
		id: 'rel_pa_uploaded',
		name: 'uploaded_by',
		type: 'relation',
		required: false,
		collectionId: '_pb_users_auth_',
		cascadeDelete: false,
		maxSelect: 1
	});
	addField({ id: 'text_pa_title', name: 'title', type: 'text', required: true, max: 200 });
	addField({
		id: 'select_pa_category',
		name: 'category',
		type: 'select',
		required: true,
		maxSelect: 1,
		values: ['photo', 'document', 'prior_record']
	});
	addField({ id: 'text_pa_notes', name: 'notes', type: 'text', required: false, max: 2000 });
	addField({
		id: 'file_pa_file',
		name: 'file',
		type: 'file',
		required: true,
		maxSelect: 1,
		maxSize: 10485760,
		mimeTypes: [
			'image/jpeg',
			'image/png',
			'image/webp',
			'image/heic',
			'application/pdf'
		]
	});

	app.save(attachments);

	attachments = app.findCollectionByNameOrId('patient_attachments');
	attachments.listRule = noteAccess;
	attachments.viewRule = noteAccess;
	attachments.createRule = noteAccess;
	attachments.updateRule = noteAccess;
	attachments.deleteRule = noteAccess;
	app.save(attachments);
});
