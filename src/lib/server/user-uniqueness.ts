import type PocketBase from 'pocketbase';
import { userEmailForMobile } from '$lib/server/resolve-staff-role';

const MOBILE_REGEX = /^09\d{9}$/;

export function normalizeMobile(raw: string): string {
	let digits = raw.replace(/\D/g, '');
	if (digits.startsWith('98') && digits.length === 12) digits = '0' + digits.slice(2);
	if (digits.startsWith('9') && digits.length === 10) digits = '0' + digits;
	return digits;
}

export function normalizeUsername(raw: string): string {
	return raw.replace(/^@+/, '').trim().toLowerCase();
}

export async function findUserIdByMobile(pb: PocketBase, mobile: string): Promise<string | null> {
	const normalized = normalizeMobile(mobile);
	if (!MOBILE_REGEX.test(normalized)) return null;
	for (const filter of [`mobile = "${normalized}"`, `email = "${userEmailForMobile(normalized)}"`]) {
		try {
			const row = await pb.collection('users').getFirstListItem(filter);
			return row.id;
		} catch {
			/* try next */
		}
	}
	return null;
}

export async function findUserIdByUsername(pb: PocketBase, username: string): Promise<string | null> {
	const bare = normalizeUsername(username);
	if (!bare) return null;
	try {
		const row = await pb.collection('users').getFirstListItem(`username = "${bare}"`);
		return row.id;
	} catch {
		return null;
	}
}

export async function findStaffIdByMobile(pb: PocketBase, mobile: string): Promise<string | null> {
	const normalized = normalizeMobile(mobile);
	if (!MOBILE_REGEX.test(normalized)) return null;
	try {
		const row = await pb.collection('staff_registry').getFirstListItem(`mobile = "${normalized}"`);
		return row.id;
	} catch {
		return null;
	}
}

export async function assertMobileAvailable(
	pb: PocketBase,
	mobile: string,
	opts?: { excludeUserId?: string; excludeStaffId?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
	const normalized = normalizeMobile(mobile);
	if (!MOBILE_REGEX.test(normalized)) {
		return { ok: false, error: 'شماره موبایل نامعتبر است' };
	}

	const userId = await findUserIdByMobile(pb, normalized);
	if (userId && userId !== opts?.excludeUserId) {
		return { ok: false, error: 'این شماره موبایل قبلاً برای کاربر دیگری ثبت شده است' };
	}

	const staffId = await findStaffIdByMobile(pb, normalized);
	if (staffId && staffId !== opts?.excludeStaffId) {
		return { ok: false, error: 'این شماره موبایل در فهرست همکاران ثبت شده است' };
	}

	return { ok: true };
}

export async function assertUsernameAvailable(
	pb: PocketBase,
	username: string,
	opts?: { excludeUserId?: string }
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
	const bare = normalizeUsername(username);
	if (!bare) return { ok: true, username: '' };
	if (!/^[a-z0-9_]{3,30}$/.test(bare)) {
		return { ok: false, error: 'نام کاربری باید ۳ تا ۳۰ کاراکتر و فقط حروف انگلیسی، عدد و _ باشد' };
	}

	const ownerId = await findUserIdByUsername(pb, bare);
	if (ownerId && ownerId !== opts?.excludeUserId) {
		return { ok: false, error: 'این نام کاربری قبلاً انتخاب شده است' };
	}

	return { ok: true, username: bare };
}
