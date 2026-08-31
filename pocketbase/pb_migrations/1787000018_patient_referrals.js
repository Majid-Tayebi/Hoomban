/// <reference path="../pb_data/types.d.ts" />

/** Formal patient referrals between specialists — doctor + admin only. */
migrate((app) => {
	const viewAccess =
		"@request.auth.role = 'admin' || (@request.auth.role = 'doctor' && (from_doctor.user = @request.auth.id || to_doctor.user = @request.auth.id))";
	const createAccess =
		"@request.auth.role = 'admin' || (@request.auth.role = 'doctor' && from_doctor.user = @request.auth.id)";
	const mutateAccess =
		"@request.auth.role = 'admin' || (@request.auth.role = 'doctor' && from_doctor.user = @request.auth.id)";

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

	let referrals;
	try {
		referrals = app.findCollectionByNameOrId('patient_referrals');
	} catch {
		referrals = new Collection({
			id: 'pbc_patient_referrals',
			name: 'patient_referrals',
			type: 'base',
			listRule: null,
			viewRule: null,
			createRule: null,
			updateRule: null,
			deleteRule: null,
			fields: [pkField('text_pr_id')]
		});
		app.save(referrals);
		referrals = app.findCollectionByNameOrId('patient_referrals');
	}

	const addField = (def) => {
		if (!referrals.fields.getByName(def.name)) {
			referrals.fields.add(new Field(def));
		}
	};

	addField({
		id: 'rel_pr_patient',
		name: 'patient',
		type: 'relation',
		required: true,
		collectionId: '_pb_users_auth_',
		cascadeDelete: true,
		maxSelect: 1
	});
	addField({
		id: 'rel_pr_from',
		name: 'from_doctor',
		type: 'relation',
		required: true,
		collectionId: 'pbc_656799828',
		cascadeDelete: false,
		maxSelect: 1
	});
	addField({
		id: 'rel_pr_to',
		name: 'to_doctor',
		type: 'relation',
		required: true,
		collectionId: 'pbc_656799828',
		cascadeDelete: false,
		maxSelect: 1
	});
	addField({
		id: 'rel_pr_created',
		name: 'created_by',
		type: 'relation',
		required: false,
		collectionId: '_pb_users_auth_',
		cascadeDelete: false,
		maxSelect: 1
	});
	addField({ id: 'text_pr_reason', name: 'reason', type: 'text', required: true, max: 2000 });
	addField({
		id: 'text_pr_summary',
		name: 'clinical_summary',
		type: 'text',
		required: false,
		max: 5000
	});
	addField({
		id: 'select_pr_status',
		name: 'status',
		type: 'select',
		required: true,
		maxSelect: 1,
		values: ['pending', 'accepted', 'completed', 'cancelled']
	});

	app.save(referrals);

	referrals = app.findCollectionByNameOrId('patient_referrals');
	referrals.listRule = viewAccess;
	referrals.viewRule = viewAccess;
	referrals.createRule = createAccess;
	referrals.updateRule = mutateAccess;
	referrals.deleteRule = "@request.auth.role = 'admin'";
	app.save(referrals);
});
