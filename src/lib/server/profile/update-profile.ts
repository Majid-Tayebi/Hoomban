/**
 * Server-side profile mutations — always run with the caller's PocketBase token
 * so collection updateRules (role lock) stay enforced. Never accept `role` from body.
 */
import type PocketBase from 'pocketbase';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import {
	findUserIdByUsername,
	normalizeUsername
} from '$lib/server/user-uniqueness';
import { isValidProvince, isValidCityForProvince } from '$lib/data/iran-provinces';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

export type ProfileDetailsPatch = {
	name?: string;
	username?: string;
	birth_date?: string;
};

export type ProfileAddressPatch = {
	province?: string;
	city?: string;
	home_address?: string;
	landline?: string;
};

function pbWithUserToken(base: PocketBase, token: string): PocketBase {
	base.authStore.save(token, null as never);
	return base;
}

export async function updateProfileDetails(
	pb: PocketBase,
	token: string,
	userId: string,
	patch: ProfileDetailsPatch
) {
	const client = pbWithUserToken(pb, token);
	const data: Record<string, string> = {};

	if (patch.name !== undefined) {
		const name = patch.name.trim();
		if (!name) throw new Error('نام و نام خانوادگی را وارد کنید');
		data.name = name;
	}

	if (patch.username !== undefined) {
		const username = normalizeUsername(patch.username);
		if (username && !USERNAME_RE.test(username)) {
			throw new Error('نام کاربری باید ۳ تا ۳۰ کاراکتر و فقط حروف انگلیسی، عدد و _ باشد');
		}
		if (username) {
			const other = await findUserIdByUsername(client, username);
			if (other && other !== userId) throw new Error('این نام کاربری قبلاً ثبت شده است');
			data.username = username;
		}
	}

	if (patch.birth_date !== undefined) {
		data.birth_date = patch.birth_date.slice(0, 10);
	}

	if (!Object.keys(data).length) throw new Error('هیچ فیلدی برای به‌روزرسانی ارسال نشده');

	return client.collection('users').update(userId, data, PB_NO_AUTO_CANCEL);
}

export async function updateProfileAddress(
	pb: PocketBase,
	token: string,
	userId: string,
	patch: ProfileAddressPatch
) {
	const client = pbWithUserToken(pb, token);
	const province = (patch.province ?? '').trim();
	const city = (patch.city ?? '').trim();

	if (province && !isValidProvince(province)) {
		throw new Error('استان نامعتبر است');
	}
	if (province && city && !isValidCityForProvince(province, city)) {
		throw new Error('شهر با استان هم‌خوان نیست');
	}

	const data = {
		province,
		city,
		home_address: (patch.home_address ?? '').trim(),
		landline: (patch.landline ?? '').trim()
	};

	return client.collection('users').update(userId, data, PB_NO_AUTO_CANCEL);
}

export async function updateProfileAvatar(
	pb: PocketBase,
	token: string,
	userId: string,
	avatar: File
) {
	const client = pbWithUserToken(pb, token);
	const form = new FormData();
	form.append('avatar', avatar);
	return client.collection('users').update(userId, form, PB_NO_AUTO_CANCEL);
}

export async function updateProfilePassword(
	pb: PocketBase,
	token: string,
	userId: string,
	input: { oldPassword?: string; password: string; passwordConfirm: string }
) {
	if (input.password.length < 8) throw new Error('رمز جدید باید حداقل ۸ کاراکتر باشد');
	if (input.password !== input.passwordConfirm) {
		throw new Error('تکرار رمز با رمز جدید یکسان نیست');
	}

	const client = pbWithUserToken(pb, token);
	const payload: Record<string, string> = {
		password: input.password,
		passwordConfirm: input.passwordConfirm
	};
	if (input.oldPassword) payload.oldPassword = input.oldPassword;

	return client.collection('users').update(userId, payload, PB_NO_AUTO_CANCEL);
}
