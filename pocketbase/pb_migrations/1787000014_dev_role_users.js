/// <reference path="../pb_data/types.d.ts" />

/**
 * Dev-only credentials for local QA (username + password 1234).
 * Usernames: admin | secretary | doctor | writer | patient
 * Password: 12341234 (PocketBase min 8 chars; mnemonic: 1234 twice)
 */
migrate((app) => {
	const users = app.findCollectionByNameOrId('_pb_users_auth_');
	const staff = app.findCollectionByNameOrId('staff_registry');
	const DEV_PASSWORD = '12341234';

	const devAccounts = [
		{ username: 'admin', role: 'admin', name: 'مدیر کلینیک', mobile: '09120000004', staff: true },
		{ username: 'secretary', role: 'secretary', name: 'منشی کلینیک', mobile: '09120000003', staff: true },
		{ username: 'doctor', role: 'doctor', name: 'دکتر احمدی', mobile: '09120000001', staff: true },
		{ username: 'writer', role: 'writer', name: 'نویسنده محتوا', mobile: '09120000005', staff: true },
		{ username: 'patient', role: 'patient', name: 'مراجع نمونه', mobile: '09120000006', staff: false }
	];

	function findUser(username, mobile) {
		try {
			return app.findFirstRecordByFilter('users', `username = "${username}"`);
		} catch {
			/* continue */
		}
		try {
			return app.findFirstRecordByFilter('users', `mobile = "${mobile}"`);
		} catch {
			return null;
		}
	}

	function upsertStaffRow(mobile, role, name) {
		let row;
		try {
			row = app.findFirstRecordByFilter('staff_registry', `mobile = "${mobile}"`);
		} catch {
			row = new Record(staff);
		}
		row.set('mobile', mobile);
		row.set('role', role);
		row.set('name', name);
		row.set('active', true);
		app.save(row);
	}

	for (const account of devAccounts) {
		let user = findUser(account.username, account.mobile);
		const email = `dev_${account.username}@hoomban.local`;

		if (!user) {
			user = new Record(users);
			user.set('email', email);
		}

		user.set('username', account.username);
		user.set('emailVisibility', true);
		user.set('password', DEV_PASSWORD);
		user.set('passwordConfirm', DEV_PASSWORD);
		user.set('name', account.name);
		user.set('role', account.role);
		user.set('mobile', account.mobile);
		user.set('verified', true);
		app.save(user);

		if (account.staff) {
			upsertStaffRow(account.mobile, account.role, account.name);
		}
	}
});
