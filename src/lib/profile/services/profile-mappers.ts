import { appAvatarUrl } from '$lib/avatar-url';
import type { ProfileRecord } from './profile-types';

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

function avatarUrlFromRecord(record: {
	id: string;
	avatar?: unknown;
	updated?: unknown;
}): string | null {
	return appAvatarUrl(record.id, record.avatar, record.updated);
}

export function userAvatarUrl(
	userId: string,
	avatar: unknown,
	updated?: unknown,
	_token?: string
): string | null {
	return appAvatarUrl(userId, avatar, updated);
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
}, _token?: string): ProfileRecord {
	const birthRaw =
		record.birth_date != null && String(record.birth_date)
			? String(record.birth_date).slice(0, 10)
			: 'birthDate' in record && record.birthDate
				? String(record.birthDate).slice(0, 10)
				: '';
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

export function pocketBaseErrorMessage(error: unknown): string {
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
