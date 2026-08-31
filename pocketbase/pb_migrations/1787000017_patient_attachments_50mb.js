/// <reference path="../pb_data/types.d.ts" />

/** Raise patient attachment file limit to 50 MB. */
migrate((app) => {
	const attachments = app.findCollectionByNameOrId('patient_attachments');
	const fileField = attachments.fields.getByName('file');
	if (fileField) {
		fileField.maxSize = 52428800;
	}
	app.save(attachments);
});
