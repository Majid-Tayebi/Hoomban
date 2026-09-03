/// <reference path="../pb_data/types.d.ts" />

/**
 * Deny direct client creates on psych_results — only server (admin) may insert
 * after server-side score validation.
 */
migrate(
	(app) => {
		const psychResults = app.findCollectionByNameOrId('psych_results');
		psychResults.createRule = null;
		app.save(psychResults);
	},
	(app) => {
		const psychResults = app.findCollectionByNameOrId('psych_results');
		psychResults.createRule = "@request.auth.id != '' && user = @request.auth.id";
		app.save(psychResults);
	}
);
