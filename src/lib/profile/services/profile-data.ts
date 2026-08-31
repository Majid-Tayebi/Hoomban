import { pb } from '$lib/pocketbase';

const profileRequestOptions = { $autoCancel: false as const };

export type ProfileRecord = {
	id: string;
	name: string;
	email: string;
	mobile: string;
	username: string;
	birthDate: string;
	province: string;
	city: string;
	homeAddress: string;
	landline: string;
	address: string;
	avatarUrl: string | null;
	verified: boolean;
};

export function normalizeIranMobile(raw: string): string {
	let digits = raw.replace(/\D/g, '');
	if (digits.startsWith('98') && digits.length === 12) digits = '0' + digits.slice(2);
	if (digits.startsWith('9') && digits.length === 10) digits = '0' + digits;
	return digits;
}

export function mobileLocalPart(mobile: string): string {
	const normalized = normalizeIranMobile(mobile);
	return normalized.startsWith('0') ? normalized.slice(1) : normalized;
}

export function isValidIranMobile(mobile: string): boolean {
	return /^09\d{9}$/.test(normalizeIranMobile(mobile));
}

export function isValidUsername(value: string): boolean {
	const bare = stripUsernamePrefix(value);
	return /^[a-zA-Z0-9_]{3,30}$/.test(bare);
}

export function stripUsernamePrefix(value: string): string {
	return value.replace(/^@+/, '').trim();
}

export function usernameWithPrefix(value: string): string {
	const bare = stripUsernamePrefix(value);
	return bare ? `@${bare}` : '@';
}

export function splitFullName(full: string): { firstName: string; lastName: string } {
	const parts = full.trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return { firstName: '', lastName: '' };
	if (parts.length === 1) return { firstName: parts[0], lastName: '' };
	return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function avatarUrlFromRecord(record: { id: string; avatar?: unknown; updated?: unknown }): string | null {
	if (!record.avatar) return null;
	const base = pb.files.getURL(
		{ id: record.id, collectionName: 'users' } as never,
		String(record.avatar)
	);
	const cacheKey = record.updated ? String(record.updated) : record.id;
	return `${base}${base.includes('?') ? '&' : '?'}v=${encodeURIComponent(cacheKey)}`;
}

export function userAvatarUrl(
	userId: string,
	avatar: unknown,
	updated?: unknown
): string | null {
	if (!avatar) return null;
	return avatarUrlFromRecord({ id: userId, avatar, updated });
}

function pocketBaseErrorMessage(error: unknown): string {
	if (error instanceof Error && /auto[\s-]?cancel/i.test(error.message)) {
		return 'درخواست قبلی لغو شد — لطفاً دوباره تلاش کنید';
	}
	if (error && typeof error === 'object' && 'response' in error) {
		const response = (error as { response?: { data?: Record<string, { message?: string }>; message?: string } })
			.response;
		const fieldMsg = response?.data
			? Object.values(response.data)
					.map((item) => item?.message)
					.filter(Boolean)
					.join(' — ')
			: '';
		if (fieldMsg) return fieldMsg;
		if (response?.message) return response.message;
	}
	if (error instanceof Error) return error.message;
	return 'ذخیره ناموفق بود';
}

export async function loadProfile(userId: string): Promise<ProfileRecord> {
	const record = await pb.collection('users').getOne(userId, profileRequestOptions);
	return mapProfileRecord(record);
}

export function mapProfileRecord(record: {
	id: string;
	name?: unknown;
	email?: unknown;
	mobile?: unknown;
	username?: unknown;
	birth_date?: unknown;
	province?: unknown;
	city?: unknown;
	home_address?: unknown;
	landline?: unknown;
	address?: unknown;
	avatar?: unknown;
	verified?: unknown;
	updated?: unknown;
}): ProfileRecord {
	const birthRaw = record.birth_date ? String(record.birth_date).slice(0, 10) : '';
	return {
		id: record.id,
		name: String(record.name || ''),
		email: String(record.email || ''),
		mobile: String(record.mobile || ''),
		username: String(record.username || ''),
		birthDate: birthRaw,
		province: String(record.province || ''),
		city: String(record.city || ''),
		homeAddress: String(record.home_address || record.address || ''),
		landline: String(record.landline || ''),
		address: String(record.address || ''),
		avatarUrl: avatarUrlFromRecord(record),
		verified: Boolean(record.verified)
	};
}

export type SaveProfileDetailsInput = {
	firstName: string;
	lastName: string;
	birthDate: string;
	username: string;
	avatarFile?: File | null;
};

export type SaveProfileAddressInput = {
	province: string;
	city: string;
	homeAddress: string;
	landline: string;
};

async function updateUserFields(userId: string, data: Record<string, string>) {
	const form = new FormData();
	for (const [key, value] of Object.entries(data)) {
		if (value !== undefined) form.append(key, value);
	}
	await pb.collection('users').update(userId, form, profileRequestOptions);
}

export async function checkFieldUnique(
	field: 'mobile' | 'username',
	value: string,
	userId?: string
): Promise<{ available: true } | { available: false; error: string }> {
	try {
		const res = await fetch('/api/profile/check-unique', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
			},
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

	const payload: Record<string, string> = { name };
	if (username) payload.username = username;
	if (input.birthDate) payload.birth_date = input.birthDate;

	try {
		await updateUserFields(userId, payload);
	} catch (error) {
		throw new Error(pocketBaseErrorMessage(error));
	}

	if (input.avatarFile) {
		const avatarData = new FormData();
		avatarData.append('avatar', input.avatarFile);
		try {
			await pb.collection('users').update(userId, avatarData, profileRequestOptions);
		} catch (error) {
			throw new Error(`ذخیره عکس پروفایل ناموفق بود — ${pocketBaseErrorMessage(error)}`);
		}
	}

	return pb.collection('users').getOne(userId, profileRequestOptions);
}

export async function saveProfileAddress(userId: string, input: SaveProfileAddressInput) {
	const payload: Record<string, string> = {
		province: input.province.trim(),
		city: input.city.trim(),
		home_address: input.homeAddress.trim(),
		landline: input.landline.trim()
	};

	try {
		await updateUserFields(userId, payload);
	} catch (error) {
		throw new Error(pocketBaseErrorMessage(error));
	}

	return pb.collection('users').getOne(userId, profileRequestOptions);
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
	userId: string,
	input: { oldPassword: string; password: string; passwordConfirm: string }
) {
	if (!input.oldPassword) throw new Error('رمز عبور فعلی را وارد کنید');
	if (input.password.length < 8) throw new Error('رمز جدید باید حداقل ۸ کاراکتر باشد');
	if (input.password !== input.passwordConfirm) throw new Error('تکرار رمز با رمز جدید یکسان نیست');

	try {
		return await pb.collection('users').update(
			userId,
			{
				oldPassword: input.oldPassword,
				password: input.password,
				passwordConfirm: input.passwordConfirm
			},
			profileRequestOptions
		);
	} catch (error) {
		throw new Error(pocketBaseErrorMessage(error));
	}
}

export async function setInitialPassword(
	userId: string,
	input: { password: string; passwordConfirm: string }
) {
	if (input.password.length < 8) throw new Error('رمز باید حداقل ۸ کاراکتر باشد');
	if (input.password !== input.passwordConfirm) throw new Error('تکرار رمز با رمز جدید یکسان نیست');

	try {
		return await pb.collection('users').update(
			userId,
			{
				password: input.password,
				passwordConfirm: input.passwordConfirm
			},
			profileRequestOptions
		);
	} catch (error) {
		throw new Error(pocketBaseErrorMessage(error));
	}
}
