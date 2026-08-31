/// <reference path="../pb_data/types.d.ts" />

/** Per-date doctor availability (ISO date → slots). */
migrate((app) => {
	const doctors = app.findCollectionByNameOrId('doctors');
	if (!doctors.fields.getByName('schedule_dates')) {
		doctors.fields.add(
			new Field({
				id: 'json_doc_schedule_dates',
				name: 'schedule_dates',
				type: 'json',
				required: false
			})
		);
	}
	app.save(doctors);
});
