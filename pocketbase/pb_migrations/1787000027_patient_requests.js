/// <reference path="../pb_data/types.d.ts" />

/** Patient support requests (e.g. late cancellation) for secretary follow-up. */
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

	let requests;
	try {
		requests = app.findCollectionByNameOrId('patient_requests');
	} catch {
		requests = new Collection({
			id: 'pbc_patient_requests',
			name: 'patient_requests',
			type: 'base',
			listRule: null,
			viewRule: null,
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [pkField('text_pr_id')]
		});
		app.save(requests);
		requests = app.findCollectionByNameOrId('patient_requests');
	}

	const addField = (def) => {
		if (!requests.fields.getByName(def.name)) {
			requests.fields.add(new Field(def));
		}
	};

	addField({
		id: 'rel_pr_patient',
		name: 'patient',
		type: 'relation',
		required: true,
		collectionId: '_pb_users_auth_',
		maxSelect: 1
	});
	const appointments = app.findCollectionByNameOrId('appointments');

	addField({
		id: 'rel_pr_appointment',
		name: 'appointment',
		type: 'relation',
		required: false,
		collectionId: appointments.id,
		maxSelect: 1
	});
	addField({
		id: 'select_pr_category',
		name: 'category',
		type: 'select',
		required: true,
		maxSelect: 1,
		values: ['appointment_cancel', 'general']
	});
	addField({
		id: 'text_pr_message',
		name: 'message',
		type: 'text',
		required: true,
		max: 2000
	});
	addField({
		id: 'select_pr_status',
		name: 'status',
		type: 'select',
		required: true,
		maxSelect: 1,
		values: ['pending', 'resolved']
	});

	app.save(requests);

	requests = app.findCollectionByNameOrId('patient_requests');
	const own = '@request.auth.id = patient.id';
	const staff =
		'@request.auth.role = "admin" || @request.auth.role = "secretary"';
	requests.listRule = `${own} || ${staff}`;
	requests.viewRule = `${own} || ${staff}`;
	requests.createRule = own;
	requests.updateRule = staff;
	requests.deleteRule = staff;
	app.save(requests);
}, (app) => {
	try {
		app.findCollectionByNameOrId('patient_requests');
		app.delete(app.findCollectionByNameOrId('patient_requests'));
	} catch {
		/* already removed */
	}
});
