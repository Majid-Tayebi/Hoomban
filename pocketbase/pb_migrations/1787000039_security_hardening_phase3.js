/// <reference path="../pb_data/types.d.ts" />

/**
 * Security hardening phase 3 (PocketBase 0.27+):
 * - users: lock role / verified / emailVisibility via :changed modifier (@request.body)
 * - appointments: server-only create/update
 */
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('_pb_users_auth_');
		users.updateRule =
			"@request.auth.role = 'admin' || (id = @request.auth.id && @request.body.role:changed = false && @request.body.verified:changed = false && @request.body.emailVisibility:changed = false)";
		app.save(users);

		const appointments = app.findCollectionByNameOrId('appointments');
		appointments.createRule = null;
		appointments.updateRule = null;
		appointments.deleteRule = "@request.auth.role = 'admin'";
		app.save(appointments);
	},
	(app) => {
		const users = app.findCollectionByNameOrId('_pb_users_auth_');
		users.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'";
		app.save(users);

		const appointments = app.findCollectionByNameOrId('appointments');
		const adminOrSec = "@request.auth.role = 'admin' || @request.auth.role = 'secretary'";
		appointments.createRule = "@request.auth.id != ''";
		appointments.updateRule = adminOrSec + " || @request.auth.role = 'doctor'";
		appointments.deleteRule = "@request.auth.role = 'admin'";
		app.save(appointments);
	}
);
