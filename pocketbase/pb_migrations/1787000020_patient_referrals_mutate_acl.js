/// <reference path="../pb_data/types.d.ts" />

/** Allow referrer to edit/delete pending referrals; recipient to accept. */
migrate((app) => {
	const referrals = app.findCollectionByNameOrId('patient_referrals');

	referrals.updateRule =
		"@request.auth.role = 'admin' || (@request.auth.role = 'doctor' && from_doctor.user = @request.auth.id) || (@request.auth.role = 'doctor' && to_doctor.user = @request.auth.id && status = 'pending' && @request.body.status = 'accepted')";

	referrals.deleteRule =
		"@request.auth.role = 'admin' || (@request.auth.role = 'doctor' && from_doctor.user = @request.auth.id && status = 'pending')";

	app.save(referrals);
});
