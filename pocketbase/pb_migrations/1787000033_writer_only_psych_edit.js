/// <reference path="../pb_data/types.d.ts" />

/** Only writers may create/update/delete psych test content (questions & options). */
migrate((app) => {
	const writerOnly = "@request.auth.role = 'writer'";

	for (const name of ['psych_tests', 'psych_questions']) {
		const col = app.findCollectionByNameOrId(name);
		col.createRule = writerOnly;
		col.updateRule = writerOnly;
		col.deleteRule = writerOnly;
		app.save(col);
	}
});
