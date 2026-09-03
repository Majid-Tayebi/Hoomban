/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix users.updateRule — :changed on system auth fields (verified, emailVisibility)
 * caused all self-service profile updates to fail with 404.
 * Use :isset to block explicit tampering; profile API already omits these fields.
 */
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('_pb_users_auth_');
		users.updateRule =
			"@request.auth.role = 'admin' || (id = @request.auth.id && @request.body.role:isset = false && @request.body.verified:isset = false && @request.body.emailVisibility:isset = false)";
		app.save(users);
	},
	(app) => {
		const users = app.findCollectionByNameOrId('_pb_users_auth_');
		users.updateRule =
			"@request.auth.role = 'admin' || (id = @request.auth.id && @request.body.role:changed = false && @request.body.verified:changed = false && @request.body.emailVisibility:changed = false)";
		app.save(users);
	}
);
