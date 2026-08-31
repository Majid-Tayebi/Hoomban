/// <reference path="../pb_data/types.d.ts" />

/** Partial waiver: secretary can forgive part of a fee (not only full write-off). */
migrate((app) => {
	const transactions = app.findCollectionByNameOrId('transactions');

	if (!transactions.fields.getByName('waived_amount')) {
		transactions.fields.add(
			new Field({
				id: 'num_tx_waived',
				name: 'waived_amount',
				type: 'number',
				required: false,
				min: 0
			})
		);
	}

	app.save(transactions);

	const records = app.findRecordsByFilter('transactions', 'status = "waived"', 'id', 500, 0);
	for (const record of records) {
		const expected = Number(record.get('expected_amount') || 0);
		const paid = Number(record.get('paid_amount') || 0);
		const current = Number(record.get('waived_amount') || 0);
		if (current > 0) continue;
		record.set('waived_amount', Math.max(0, expected - paid));
		app.save(record);
	}
});
