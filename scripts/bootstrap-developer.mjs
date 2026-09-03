#!/usr/bin/env node
/**
 * Idempotent bootstrap: ensure DEVELOPER_USERNAME exists with admin role + staff_registry row.
 * Uses PocketBase HTTP API only (no extra npm deps).
 */
const PB_URL = (process.env.POCKETBASE_URL || 'http://pocketbase:8090').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || '';
const USERNAME = (process.env.DEVELOPER_USERNAME || 'developer').trim();
const PASSWORD = process.env.DEVELOPER_PASSWORD || '';
const NAME = process.env.DEVELOPER_NAME || 'Developer';
const MOBILE = process.env.DEVELOPER_MOBILE || '09120000099';
const EMAIL = process.env.DEVELOPER_EMAIL || `developer@hoomban.local`;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
	console.error('bootstrap-developer: POCKETBASE_ADMIN_EMAIL/PASSWORD required');
	process.exit(1);
}
if (!PASSWORD || PASSWORD.length < 8) {
	console.error('bootstrap-developer: DEVELOPER_PASSWORD must be at least 8 characters');
	process.exit(1);
}

async function pbFetch(path, { method = 'GET', token, body } = {}) {
	const headers = { Accept: 'application/json' };
	if (token) headers.Authorization = token;
	if (body !== undefined) headers['Content-Type'] = 'application/json';
	const res = await fetch(`${PB_URL}${path}`, {
		method,
		headers,
		body: body !== undefined ? JSON.stringify(body) : undefined
	});
	const text = await res.text();
	let data;
	try {
		data = text ? JSON.parse(text) : {};
	} catch {
		data = { raw: text };
	}
	if (!res.ok) {
		const err = new Error(data.message || res.statusText || 'PocketBase request failed');
		err.status = res.status;
		err.data = data;
		throw err;
	}
	return data;
}

async function authSuperuser() {
	const data = await pbFetch('/api/collections/_superusers/auth-with-password', {
		method: 'POST',
		body: { identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }
	});
	return data.token;
}

async function findUserByUsername(token, username) {
	const filter = encodeURIComponent(`username = "${username}"`);
	const data = await pbFetch(`/api/collections/users/records?filter=${filter}&perPage=1`, {
		token
	});
	return data.items?.[0] ?? null;
}

async function upsertStaff(token, mobile, role, name) {
	const filter = encodeURIComponent(`mobile = "${mobile}"`);
	const data = await pbFetch(`/api/collections/staff_registry/records?filter=${filter}&perPage=1`, {
		token
	});
	const payload = { mobile, role, name, active: true };
	if (data.items?.[0]) {
		await pbFetch(`/api/collections/staff_registry/records/${data.items[0].id}`, {
			method: 'PATCH',
			token,
			body: payload
		});
		return;
	}
	await pbFetch('/api/collections/staff_registry/records', {
		method: 'POST',
		token,
		body: payload
	});
}

async function main() {
	const token = await authSuperuser();
	const existing = await findUserByUsername(token, USERNAME);
	const userPayload = {
		username: USERNAME,
		email: EMAIL,
		emailVisibility: true,
		password: PASSWORD,
		passwordConfirm: PASSWORD,
		name: NAME,
		role: 'admin',
		mobile: MOBILE,
		verified: true
	};

	if (existing) {
		await pbFetch(`/api/collections/users/records/${existing.id}`, {
			method: 'PATCH',
			token,
			body: userPayload
		});
		console.log(`developer user updated: ${USERNAME}`);
	} else {
		await pbFetch('/api/collections/users/records', {
			method: 'POST',
			token,
			body: userPayload
		});
		console.log(`developer user created: ${USERNAME}`);
	}

	await upsertStaff(token, MOBILE, 'admin', NAME);
	console.log('staff_registry row ensured');
}

main().catch((err) => {
	console.error('bootstrap-developer failed:', err.message);
	if (err.data) console.error(JSON.stringify(err.data, null, 2));
	process.exit(1);
});
