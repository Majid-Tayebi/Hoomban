import { pb } from '$lib/pocketbase';

export type MobileChangeRequestResult =
	| { ok: true; demoCode?: string; targetUserId: string; newMobile: string; message: string }
	| { ok: false; error: string };

export type MobileChangeVerifyResult =
	| { ok: true; record: Record<string, unknown>; message: string }
	| { ok: false; error: string };

function authHeaders() {
	const token = pb.authStore.token;
	return {
		'Content-Type': 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {})
	};
}

export async function requestMobileChange(input: {
	newMobile: string;
	targetUserId?: string;
}): Promise<MobileChangeRequestResult> {
	try {
		const res = await fetch('/api/auth/mobile-change/request', {
			method: 'POST',
			headers: authHeaders(),
			body: JSON.stringify({
				newMobile: input.newMobile,
				targetUserId: input.targetUserId,
				token: pb.authStore.token
			})
		});
		const data = await res.json();
		if (!res.ok) return { ok: false, error: data.error || 'درخواست ناموفق' };
		return {
			ok: true,
			demoCode: data.demoCode,
			targetUserId: data.targetUserId,
			newMobile: data.newMobile,
			message: data.message
		};
	} catch (e: unknown) {
		return { ok: false, error: e instanceof Error ? e.message : 'خطای شبکه' };
	}
}

export async function verifyMobileChange(input: {
	newMobile: string;
	code: string;
	targetUserId?: string;
}): Promise<MobileChangeVerifyResult> {
	try {
		const res = await fetch('/api/auth/mobile-change/verify', {
			method: 'POST',
			headers: authHeaders(),
			body: JSON.stringify({
				newMobile: input.newMobile,
				code: input.code,
				targetUserId: input.targetUserId,
				token: pb.authStore.token
			})
		});
		const data = await res.json();
		if (!res.ok) return { ok: false, error: data.error || 'تأیید ناموفق' };
		return { ok: true, record: data.record, message: data.message };
	} catch (e: unknown) {
		return { ok: false, error: e instanceof Error ? e.message : 'خطای شبکه' };
	}
}
