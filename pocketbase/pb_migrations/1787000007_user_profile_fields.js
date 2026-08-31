/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
	const users = app.findCollectionByNameOrId('_pb_users_auth_');

	if (!users.fields.getByName('avatar')) {
		users.fields.add(
			new Field({
				id: 'file_user_avatar',
				name: 'avatar',
				type: 'file',
				required: false,
				maxSelect: 1,
				maxSize: 5242880,
				mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
			})
		);
	}

	if (!users.fields.getByName('address')) {
		users.fields.add(
			new Field({
				id: 'text_user_address',
				name: 'address',
				type: 'text',
				required: false,
				max: 500
			})
		);
	}

	return app.save(users);
}, (app) => {
	const users = app.findCollectionByNameOrId('_pb_users_auth_');

	const avatar = users.fields.getByName('avatar');
	if (avatar) users.fields.removeById(avatar.id);

	const address = users.fields.getByName('address');
	if (address) users.fields.removeById(address.id);

	return app.save(users);
});
