/// <reference path="../pb_data/types.d.ts" />

/** Explicitly deny secretary from psych_results (PB list rules filter, not 403). */
migrate((app) => {
	const psychResults = app.findCollectionByNameOrId('psych_results');
	const psychResultsRead =
		"@request.auth.role != 'secretary' && (user = @request.auth.id || @request.auth.role = 'admin' || (@request.auth.role = 'doctor' && @collection.appointments.patient ?= user.id && @collection.appointments.doctor.user ?= @request.auth.id))";
	psychResults.listRule = psychResultsRead;
	psychResults.viewRule = psychResultsRead;
	app.save(psychResults);
}, (app) => {
	const psychResults = app.findCollectionByNameOrId('psych_results');
	const psychResultsRead =
		"user = @request.auth.id || @request.auth.role = 'admin' || (@request.auth.role = 'doctor' && @collection.appointments.patient ?= user.id && @collection.appointments.doctor.user ?= @request.auth.id)";
	psychResults.listRule = psychResultsRead;
	psychResults.viewRule = psychResultsRead;
	app.save(psychResults);
});
