/// <reference path="../pb_data/types.d.ts" />

/** Add autodate timestamps to notifications (required for newest-first ordering). */
migrate((app) => {
	const notifications = app.findCollectionByNameOrId('notifications');

	const addAutodate = (name, id, onCreate, onUpdate) => {
		if (!notifications.fields.getByName(name)) {
			notifications.fields.add(
				new Field({
					id,
					name,
					type: 'autodate',
					required: false,
					onCreate,
					onUpdate,
					system: true
				})
			);
		}
	};

	addAutodate('created', 'autodate_notif_created', true, false);
	addAutodate('updated', 'autodate_notif_updated', true, true);

	app.save(notifications);

	const records = app.findRecordsByFilter('notifications', '', 'id', 500, 0);
	const total = records.length;
	for (let index = 0; index < total; index++) {
		const record = records[index];
		const ts = new Date(Date.now() - (total - index) * 60_000).toISOString();
		record.set('created', ts);
		record.set('updated', ts);
		app.save(record);
	}
});
