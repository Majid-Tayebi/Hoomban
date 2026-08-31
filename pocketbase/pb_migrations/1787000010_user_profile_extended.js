/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
	const users = app.findCollectionByNameOrId('_pb_users_auth_');

	const addField = (def) => {
		if (!users.fields.getByName(def.name)) {
			users.fields.add(new Field(def));
		}
	};

	addField({
		id: 'text_user_username',
		name: 'username',
		type: 'text',
		required: false,
		min: 3,
		max: 30,
		pattern: '^[a-zA-Z0-9_]+$'
	});

	addField({
		id: 'date_user_birth',
		name: 'birth_date',
		type: 'date',
		required: false
	});

	addField({
		id: 'text_user_province',
		name: 'province',
		type: 'text',
		required: false,
		max: 80
	});

	addField({
		id: 'text_user_city',
		name: 'city',
		type: 'text',
		required: false,
		max: 80
	});

	addField({
		id: 'text_user_home_address',
		name: 'home_address',
		type: 'text',
		required: false,
		max: 500
	});

	addField({
		id: 'text_user_landline',
		name: 'landline',
		type: 'text',
		required: false,
		max: 15
	});

	const usernameIndex =
		"CREATE UNIQUE INDEX `idx_users_username` ON `users` (`username`) WHERE `username` != ''";
	if (!users.indexes.includes(usernameIndex)) {
		users.indexes.push(usernameIndex);
	}

	users.passwordAuth = {
		enabled: true,
		identityFields: ['email', 'username']
	};

	return app.save(users);
}, (app) => {
	const users = app.findCollectionByNameOrId('_pb_users_auth_');

	const removeByName = (name) => {
		const field = users.fields.getByName(name);
		if (field) users.fields.removeById(field.id);
	};

	removeByName('username');
	removeByName('birth_date');
	removeByName('province');
	removeByName('city');
	removeByName('home_address');
	removeByName('landline');

	users.indexes = users.indexes.filter(
		(idx) => !idx.includes('idx_users_username')
	);

	users.passwordAuth = {
		enabled: true,
		identityFields: ['email']
	};

	return app.save(users);
});
