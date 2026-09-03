import { pb } from '$lib/pocketbase';
import type { ProfileRecord } from './profile-types';
import {
	mapProfileRecord,
	stripUsernamePrefix,
	isValidUsername
} from './profile-mappers';

export type { ProfileRecord } from './profile-types';
export {
	normalizeIranMobile,
	mobileLocalPart,
	isValidIranMobile,
	isValidUsername,
	stripUsernamePrefix,
	usernameWithPrefix,
	splitFullName,
	userAvatarUrl,
	mapProfileRecord
} from './profile-mappers';

const profileRequestOptions = { $autoCancel: false as const };

function authHeaders(json = true): HeadersInit {
	return {
		...(json ? { 'Content-Type': 'application/json' } : {}),
		...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
	};
}

async function readApiError(res: Response, fallback: string): Promise<string> {
	try {
		const data = (await res.json()) as { error?: string };
		return data.error || fallback;
	} catch {
		return fallback;
	}
}

export async function loadProfile(userId: string): Promise<ProfileRecord> {
	const record = await pb.collection('users').getOne(userId, profileRequestOptions);
	return mapProfileRecord(record);
}

export type SaveProfileDetailsInput = {
	firstName: string;
	lastName: string;
	birthDate: string;
	username: string;
	email?: string;
	avatarFile?: File | null;
};

export type SaveProfileAddressInput = {
	province: string;
	city: string;
	homeAddress: string;
	landline: string;
};

export async function checkFieldUnique(
	field: 'mobile' | 'username' | 'email',
	value: string,
	userId?: string
): Promise<{ available: true } | { available: false; error: string }> {
	try {
		const res = await fetch('/api/profile/check-unique', {
			method: 'POST',
			headers: authHeaders(),
			credentials: 'include',
			body: JSON.stringify({ field, value, excludeUserId: userId })
		});
		const data = (await res.json()) as { available?: boolean; error?: string };
		if (!res.ok || data.available === false) {
			return { available: false, error: data.error || 'مقدار تکراری است' };
		}
		return { available: true };
	} catch {
		return { available: false, error: 'بررسی یکتایی ناموفق بود' };
	}
}

export async function saveProfileDetails(userId: string, input: SaveProfileDetailsInput) {
	const name = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
	if (!name) throw new Error('نام و نام خانوادگی را وارد کنید');

	const username = stripUsernamePrefix(input.username);
	if (username && !isValidUsername(username)) {
		throw new Error('نام کاربری باید ۳ تا ۳۰ کاراکتر و فقط حروف انگلیسی، عدد و _ باشد');
	}

	if (username) {
		const unique = await checkFieldUnique('username', username, userId);
		if (!unique.available) throw new Error(unique.error);
	}

	const email = input.email?.trim().toLowerCase() ?? '';
	if (email) {
		const unique = await checkFieldUnique('email', email, userId);
		if (!unique.available) throw new Error(unique.error);
	}

	const res = await fetch('/api/profile', {
		method: 'PATCH',
		headers: authHeaders(),
		credentials: 'include',
		body: JSON.stringify({
			section: 'details',
			name,
			username: username || undefined,
			birthDate: input.birthDate || undefined,
			email: email || undefined
		})
	});
	if (!res.ok) throw new Error(await readApiError(res, 'ذخیره پروفایل ناموفق بود'));
	const data = (await res.json()) as { record?: ProfileRecord };

	if (input.avatarFile) {
		const form = new FormData();
		form.append('avatar', input.avatarFile);
		const avatarRes = await fetch('/api/profile/avatar', {
			method: 'POST',
			headers: {
				...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
			},
			credentials: 'include',
			body: form
		});
		if (!avatarRes.ok) {
			throw new Error(
				`ذخیره عکس پروفایل ناموفق بود — ${await readApiError(avatarRes, 'خطا')}`
			);
		}
		const avatarData = (await avatarRes.json()) as { record?: ProfileRecord };
		if (avatarData.record) return avatarData.record;
	}

	if (data.record) return data.record;
	return loadProfile(userId);
}

export async function saveProfileAddress(_userId: string, input: SaveProfileAddressInput) {
	const res = await fetch('/api/profile', {
		method: 'PATCH',
		headers: authHeaders(),
		credentials: 'include',
		body: JSON.stringify({
			section: 'address',
			province: input.province,
			city: input.city,
			homeAddress: input.homeAddress,
			landline: input.landline
		})
	});
	if (!res.ok) throw new Error(await readApiError(res, 'ذخیره آدرس ناموفق بود'));
	const data = (await res.json()) as { record?: ProfileRecord };
	if (data.record) return data.record;
	throw new Error('پاسخ نامعتبر از سرور');
}

/** @deprecated use saveProfileDetails / saveProfileAddress */
export type SaveProfileInput = {
	firstName: string;
	lastName: string;
	address: string;
	avatarFile?: File | null;
};

/** @deprecated use saveProfileDetails / saveProfileAddress */
export async function saveProfile(userId: string, input: SaveProfileInput) {
	return saveProfileDetails(userId, {
		firstName: input.firstName,
		lastName: input.lastName,
		birthDate: '',
		username: '',
		avatarFile: input.avatarFile
	});
}

export async function changePassword(
	_userId: string,
	input: { oldPassword: string; password: string; passwordConfirm: string }
) {
	if (!input.oldPassword) throw new Error('رمز عبور فعلی را وارد کنید');
	const res = await fetch('/api/profile/password', {
		method: 'POST',
		headers: authHeaders(),
		credentials: 'include',
		body: JSON.stringify(input)
	});
	if (!res.ok) throw new Error(await readApiError(res, 'تغییر رمز ناموفق بود'));
	return { ok: true };
}

export async function setInitialPassword(
	_userId: string,
	input: { password: string; passwordConfirm: string }
) {
	const res = await fetch('/api/profile/password', {
		method: 'POST',
		headers: authHeaders(),
		credentials: 'include',
		body: JSON.stringify(input)
	});
	if (!res.ok) throw new Error(await readApiError(res, 'تنظیم رمز ناموفق بود'));
	return { ok: true };
}
