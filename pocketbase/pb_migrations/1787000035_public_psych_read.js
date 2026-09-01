/// <reference path="../pb_data/types.d.ts" />

/** Patients take tests without staff login — keep psych content publicly readable. */
migrate((app) => {
	const writerWrite = "@request.auth.id != '' && @request.auth.role = 'writer'";

	for (const name of ['psych_tests', 'psych_questions']) {
		const col = app.findCollectionByNameOrId(name);
		col.listRule = '';
		col.viewRule = '';
		col.createRule = writerWrite;
		col.updateRule = writerWrite;
		col.deleteRule = writerWrite;
		app.save(col);
	}
});
