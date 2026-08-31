/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
	const users = app.findCollectionByNameOrId('_pb_users_auth_');

	const mobileIndex =
		"CREATE UNIQUE INDEX `idx_users_mobile` ON `users` (`mobile`) WHERE `mobile` != ''";
	if (!users.indexes.includes(mobileIndex)) {
		users.indexes.push(mobileIndex);
	}

	const staff = app.findCollectionByNameOrId('staff_registry');
	const staffMobileIndex =
		"CREATE UNIQUE INDEX `idx_staff_mobile` ON `staff_registry` (`mobile`) WHERE `mobile` != ''";
	if (!staff.indexes.includes(staffMobileIndex)) {
		staff.indexes.push(staffMobileIndex);
	}

	app.save(users);
	return app.save(staff);
}, (app) => {
	const users = app.findCollectionByNameOrId('_pb_users_auth_');
	users.indexes = users.indexes.filter((idx) => !idx.includes('idx_users_mobile'));
	app.save(users);

	const staff = app.findCollectionByNameOrId('staff_registry');
	staff.indexes = staff.indexes.filter((idx) => !idx.includes('idx_staff_mobile'));
	return app.save(staff);
});
