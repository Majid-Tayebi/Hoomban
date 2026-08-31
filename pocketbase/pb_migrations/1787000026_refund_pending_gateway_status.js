/// <reference path="../pb_data/types.d.ts" />

/** Add refund_pending to transaction gateway_status for patient-initiated cancellations. */
migrate((app) => {
	const transactions = app.findCollectionByNameOrId('transactions');
	const field = transactions.fields.getByName('gateway_status');
	if (!field) return;

	transactions.fields.removeById(field.id);
	transactions.fields.add(
		new Field({
			id: 'select_tx_gateway_status',
			name: 'gateway_status',
			type: 'select',
			required: false,
			maxSelect: 1,
			values: ['pending', 'paid', 'failed', 'cancelled', 'refund_pending']
		})
	);
	app.save(transactions);
}, (app) => {
	const transactions = app.findCollectionByNameOrId('transactions');
	const field = transactions.fields.getByName('gateway_status');
	if (!field) return;

	transactions.fields.removeById(field.id);
	transactions.fields.add(
		new Field({
			id: 'select_tx_gateway_status',
			name: 'gateway_status',
			type: 'select',
			required: false,
			maxSelect: 1,
			values: ['pending', 'paid', 'failed', 'cancelled']
		})
	);
	app.save(transactions);
});
