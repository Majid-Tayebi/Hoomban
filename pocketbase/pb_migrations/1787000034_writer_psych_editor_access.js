/// <reference path="../pb_data/types.d.ts" />

/**
 * Writer: full psych test editor (read + write).
 * Others: authenticated read-only on test content.
 */
migrate((app) => {
	const writerWrite = "@request.auth.id != '' && @request.auth.role = 'writer'";
	const authRead = "@request.auth.id != ''";

	for (const name of ['psych_tests', 'psych_questions']) {
		const col = app.findCollectionByNameOrId(name);
		col.listRule = authRead;
		col.viewRule = authRead;
		col.createRule = writerWrite;
		col.updateRule = writerWrite;
		col.deleteRule = writerWrite;
		app.save(col);
	}
});
