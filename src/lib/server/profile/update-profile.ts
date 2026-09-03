/**
 * Server-side profile mutations — caller identity verified from session token;
 * writes use admin PB because users.updateRule blocks regular record PATCH in PB 0.27.
 * Never accept `role` / `verified` / `emailVisibility` from body.
 */
import type PocketBase from 'pocketbase';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { resolveUserFromAuthToken } from '$lib/server/auth-token';
import {
	findUserIdByUsername,
	findUserIdByEmail,
	normalizeUsername
} from '$lib/server/user-uniqueness';
import { isValidProvince, isValidCityForProvince } from '$lib/data/iran-provinces';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ProfileDetailsPatch = {
	name?: string;
	username?: string;
	birth_date?: string;
	email?: string;
};

export type ProfileAddressPatch = {
	province?: string;
	city?: string;
	home_address?: string;
	landline?: string;
};

async function assertCaller(token: string, userId: string): Promise<void> {
	const caller = await resolveUserFromAuthToken(token);
	if (!caller || caller.id !== userId) {
		throw new Error('احراز هویت لازم است');
	}
}

export async function updateProfileDetails(
	_pb: PocketBase,
	token: string,
	userId: string,
	patch: ProfileDetailsPatch
) {
	await assertCaller(token, userId);
	const admin = await getAdminPb();
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
			const other = await findUserIdByUsername(admin, username);
			if (other && other !== userId) throw new Error('این نام کاربری قبلاً ثبت شده است');
			data.username = username;
		}
	}

	if (patch.birth_date !== undefined) {
		data.birth_date = patch.birth_date.slice(0, 10);
	}

	if (patch.email !== undefined) {
		const email = patch.email.trim().toLowerCase();
		if (!email) throw new Error('ایمیل را وارد کنید');
		if (!EMAIL_RE.test(email)) throw new Error('فرمت ایمیل نامعتبر است');
		const other = await findUserIdByEmail(admin, email);
		if (other && other !== userId) throw new Error('این ایمیل قبلاً ثبت شده است');
		data.email = email;
	}

	if (!Object.keys(data).length) throw new Error('هیچ فیلدی برای به‌روزرسانی ارسال نشده');

	return admin.collection('users').update(userId, data, PB_NO_AUTO_CANCEL);
}

export async function updateProfileAddress(
	_pb: PocketBase,
	token: string,
	userId: string,
	patch: ProfileAddressPatch
) {
	await assertCaller(token, userId);
	const province = (patch.province ?? '').trim();
	const city = (patch.city ?? '').trim();

	if (province && !isValidProvince(province)) {
		throw new Error('استان نامعتبر است');
	}
	if (province && city && !isValidCityForProvince(province, city)) {
		throw new Error('شهر با استان انتخاب‌شده هم‌خوان نیست');
	}
	if (province && !city) {
		throw new Error('شهر را انتخاب کنید');
	}
	if (city && !province) {
		throw new Error('ابتدا استان را انتخاب کنید');
	}

	const admin = await getAdminPb();
	const data: Record<string, string> = {
		province,
		city,
		home_address: (patch.home_address ?? '').trim(),
		landline: (patch.landline ?? '').trim()
	};
	const homeAddress = data.home_address;
	if (homeAddress) data.address = homeAddress;

	return admin.collection('users').update(userId, data, PB_NO_AUTO_CANCEL);
}

export async function updateProfileAvatar(
	_pb: PocketBase,
	token: string,
	userId: string,
	avatar: File
) {
	await assertCaller(token, userId);
	const admin = await getAdminPb();
	const form = new FormData();
	form.append('avatar', avatar);
	return admin.collection('users').update(userId, form, PB_NO_AUTO_CANCEL);
}

export async function updateProfilePassword(
	_pb: PocketBase,
	token: string,
	userId: string,
	input: { oldPassword?: string; password: string; passwordConfirm: string }
) {
	await assertCaller(token, userId);
	if (input.password.length < 8) throw new Error('رمز جدید باید حداقل ۸ کاراکتر باشد');
	if (input.password !== input.passwordConfirm) {
		throw new Error('تکرار رمز با رمز جدید یکسان نیست');
	}

	const admin = await getAdminPb();
	const payload: Record<string, string> = {
		password: input.password,
		passwordConfirm: input.passwordConfirm
	};
	if (input.oldPassword) payload.oldPassword = input.oldPassword;

	return admin.collection('users').update(userId, payload, PB_NO_AUTO_CANCEL);
}
