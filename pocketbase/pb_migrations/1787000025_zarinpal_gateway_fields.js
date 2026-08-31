/// <reference path="../pb_data/types.d.ts" />

/** ZarinPal gateway metadata on desk transactions. */
migrate((app) => {
	const transactions = app.findCollectionByNameOrId('transactions');

	const addField = (def) => {
		if (!transactions.fields.getByName(def.name)) {
			transactions.fields.add(new Field(def));
		}
	};

	addField({
		id: 'text_tx_gateway',
		name: 'gateway',
		type: 'text',
		required: false,
		max: 32
	});
	addField({
		id: 'text_tx_gateway_authority',
		name: 'gateway_authority',
		type: 'text',
		required: false,
		max: 64
	});
	addField({
		id: 'text_tx_gateway_ref',
		name: 'gateway_ref_id',
		type: 'text',
		required: false,
		max: 64
	});
	addField({
		id: 'select_tx_gateway_status',
		name: 'gateway_status',
		type: 'select',
		required: false,
		maxSelect: 1,
		values: ['pending', 'paid', 'failed', 'cancelled']
	});
	addField({
		id: 'num_tx_amount_rial',
		name: 'amount_rial',
		type: 'number',
		required: false,
		min: 0
	});

	const methodField = transactions.fields.getByName('method');
	if (methodField) {
		transactions.fields.removeById(methodField.id);
	}
	transactions.fields.add(
		new Field({
			id: 'select_tx_method',
			name: 'method',
			type: 'select',
			required: false,
			maxSelect: 1,
			values: ['cash', 'card', 'transfer', 'gateway', 'other']
		})
	);

	app.save(transactions);
}, (app) => {
	const transactions = app.findCollectionByNameOrId('transactions');
	for (const name of [
		'gateway',
		'gateway_authority',
		'gateway_ref_id',
		'gateway_status',
		'amount_rial'
	]) {
		const f = transactions.fields.getByName(name);
		if (f) transactions.fields.removeById(f.id);
	}
	app.save(transactions);
});
