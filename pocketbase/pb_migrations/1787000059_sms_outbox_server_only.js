/// <reference path="../pb_data/types.d.ts" />

/**
 * sms_outbox: server-only via SvelteKit getAdminPb.
 * Prevents browser PocketBase clients from creating/reading outbox
 * (all SMS send/dispatch must go through /api/sms/* handlers so API keys stay server-side).
 */
migrate((app) => {
	const smsOutbox = app.findCollectionByNameOrId('sms_outbox');
	smsOutbox.listRule = null;
	smsOutbox.viewRule = null;
	smsOutbox.createRule = null;
	smsOutbox.updateRule = null;
	smsOutbox.deleteRule = null;
	app.save(smsOutbox);
}, (app) => {
	const adminOrSec =
		"@request.auth.role = 'admin' || @request.auth.role = 'secretary'";
	try {
		const smsOutbox = app.findCollectionByNameOrId('sms_outbox');
		smsOutbox.listRule = adminOrSec;
		smsOutbox.viewRule = adminOrSec;
		smsOutbox.createRule = adminOrSec;
		smsOutbox.updateRule = "@request.auth.role = 'admin'";
		smsOutbox.deleteRule = "@request.auth.role = 'admin'";
		app.save(smsOutbox);
	} catch {
		/* ignore */
	}
});
