/// <reference path="../pb_data/types.d.ts" />

/** Add autodate timestamps to patient_referrals (missing on initial create). */
migrate((app) => {
	const referrals = app.findCollectionByNameOrId('patient_referrals');

	const addAutodate = (name, id, onCreate, onUpdate) => {
		if (!referrals.fields.getByName(name)) {
			referrals.fields.add(
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

	addAutodate('created', 'autodate_pr_created', true, false);
	addAutodate('updated', 'autodate_pr_updated', true, true);

	app.save(referrals);
});
