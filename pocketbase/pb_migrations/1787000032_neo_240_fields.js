/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
	const psychTests = app.findCollectionByNameOrId('psych_tests');
	if (!psychTests.fields.getByName('test_type')) {
		psychTests.fields.add(
			new Field({
				id: 'text_psych_test_type',
				name: 'test_type',
				type: 'text',
				required: false,
				max: 40
			})
		);
	}
	if (!psychTests.fields.getByName('scoring_config')) {
		psychTests.fields.add(
			new Field({
				id: 'json_psych_scoring_cfg',
				name: 'scoring_config',
				type: 'json',
				required: false
			})
		);
	}
	app.save(psychTests);

	const psychQuestions = app.findCollectionByNameOrId('psych_questions');
	if (!psychQuestions.fields.getByName('domain_key')) {
		psychQuestions.fields.add(
			new Field({
				id: 'text_psych_q_domain',
				name: 'domain_key',
				type: 'text',
				required: false,
				max: 4
			})
		);
	}
	if (!psychQuestions.fields.getByName('facet_key')) {
		psychQuestions.fields.add(
			new Field({
				id: 'text_psych_q_facet',
				name: 'facet_key',
				type: 'text',
				required: false,
				max: 8
			})
		);
	}
	if (!psychQuestions.fields.getByName('reverse_scored')) {
		psychQuestions.fields.add(
			new Field({
				id: 'bool_psych_q_reverse',
				name: 'reverse_scored',
				type: 'bool',
				required: false
			})
		);
	}
	app.save(psychQuestions);
});
