/// <reference path="../pb_data/types.d.ts" />

/**
 * Security hardening phase 2:
 * - users: secretary/doctor see patients only (contact coordination for secretary)
 * - psych_results: scoped access; secretary removed; create requires own user
 */
migrate((app) => {
	// ---------- users ----------
	const users = app.findCollectionByNameOrId('_pb_users_auth_');
	const usersListView =
		"id = @request.auth.id || @request.auth.role = 'admin' || (@request.auth.role = 'secretary' && role = 'patient') || (@request.auth.role = 'doctor' && role = 'patient')";
	users.listRule = usersListView;
	users.viewRule = usersListView;
	app.save(users);

	// ---------- psych_results ----------
	const psychResults = app.findCollectionByNameOrId('psych_results');
	const psychResultsRead =
		"@request.auth.role != 'secretary' && (user = @request.auth.id || @request.auth.role = 'admin' || (@request.auth.role = 'doctor' && @collection.appointments.patient ?= user.id && @collection.appointments.doctor.user ?= @request.auth.id))";
	psychResults.listRule = psychResultsRead;
	psychResults.viewRule = psychResultsRead;
	psychResults.createRule = "@request.auth.id != '' && user = @request.auth.id";
	app.save(psychResults);
}, (app) => {
	const users = app.findCollectionByNameOrId('_pb_users_auth_');
	users.listRule =
		"id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'doctor'";
	users.viewRule =
		"id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'doctor'";
	app.save(users);

	const psychResults = app.findCollectionByNameOrId('psych_results');
	psychResults.listRule =
		"user = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'doctor' || @request.auth.role = 'secretary'";
	psychResults.viewRule =
		"user = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'doctor' || @request.auth.role = 'secretary'";
	psychResults.createRule = "@request.auth.id != ''";
	app.save(psychResults);
});
