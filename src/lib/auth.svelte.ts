import { pb } from '$lib/pocketbase';
import { userAvatarUrl } from '$lib/profile/services/profile-data';
import { dev } from '$app/environment';

export type UserRole = 'patient' | 'doctor' | 'secretary' | 'admin' | 'writer';

export type AuthUser = {
	id: string;
	name?: string;
	email?: string;
	role?: string;
	mobile?: string;
	username?: string;
	birth_date?: string;
	province?: string;
	city?: string;
	home_address?: string;
	landline?: string;
	avatar?: string;
	avatarUrl?: string | null;
	address?: string;
	[key: string]: unknown;
} | null;

const DEMO_KEY = 'hoomban_demo_user';

function readDemoUser(): AuthUser {
	if (typeof window === 'undefined' || !dev) return null;
	try {
		const raw = localStorage.getItem(DEMO_KEY);
		return raw ? (JSON.parse(raw) as AuthUser) : null;
	} catch {
		return null;
	}
}

function enrichUser(model: AuthUser): AuthUser {
	if (!model?.id) return model;
	const avatarUrl = userAvatarUrl(model.id, model.avatar, model.updated);
	return { ...model, avatarUrl };
}

function fromAuthStore(): AuthUser {
	const model = pb.authStore.model as AuthUser;
	return enrichUser(model ?? readDemoUser());
}

let currentUser = $state<AuthUser>(null);
let hydrated = $state(false);

function syncFromPocketBase() {
	currentUser = fromAuthStore();
}

async function syncSessionCookie() {
	if (!pb.authStore.isValid || !pb.authStore.token) return;
	try {
		await fetch('/api/auth/session', {
			method: 'POST',
			headers: { Authorization: `Bearer ${pb.authStore.token}` }
		});
	} catch {
		/* offline — SSR guard may redirect until next sync */
	}
}

export function hydrateAuth() {
	if (typeof window === 'undefined') return;
	syncFromPocketBase();
	hydrated = true;
	void syncSessionCookie();
}

if (typeof window !== 'undefined') {
	hydrateAuth();
	pb.authStore.onChange(() => {
		syncFromPocketBase();
		void syncSessionCookie();
	});
}

export function getUser() {
	return currentUser;
}

export function isAuthHydrated() {
	return hydrated;
}

export function setUserFromModel(model: AuthUser) {
	currentUser = enrichUser(model ?? readDemoUser());
}

/** Refresh auth record from PocketBase (e.g. after profile photo update). */
export async function refreshAuthUser(): Promise<AuthUser> {
	if (!pb.authStore.isValid) return currentUser;
	try {
		const auth = await pb.collection('users').authRefresh();
		const record = enrichUser(auth.record as AuthUser);
		currentUser = record;
		await syncSessionCookie();
		return record;
	} catch {
		syncFromPocketBase();
		return currentUser;
	}
}

/** Dev-only offline demo user — disabled in production builds. */
export function setDemoUser(role: UserRole = 'admin') {
	if (!dev) {
		throw new Error('ورود نمایشی فقط در محیط توسعه فعال است');
	}
	const user = {
		id: 'demo-user',
		name: 'کاربر نمایشی',
		email: 'demo@hoomban.com',
		role,
		mobile: '09000000000'
	};
	localStorage.setItem(DEMO_KEY, JSON.stringify(user));
	pb.authStore.clear();
	currentUser = user;
}

export async function clearAuth() {
	if (typeof window !== 'undefined') {
		localStorage.removeItem(DEMO_KEY);
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} catch {
			/* best effort */
		}
	}
	pb.authStore.clear();
	currentUser = null;
}

export const STAFF_ROLES = ['doctor', 'secretary', 'admin', 'writer'] as const;

export function isStaffRole(role?: string | null) {
	return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

/** Look up staff role via server API (staff_registry is not public). */
export async function resolveRoleForMobile(mobile: string): Promise<{
	role: UserRole;
	name: string;
}> {
	try {
		const res = await fetch('/api/auth/resolve-role', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mobile })
		});
		const data = (await res.json()) as { role?: UserRole; name?: string };
		return {
			role: (data.role as UserRole) || 'patient',
			name: String(data.name || '')
		};
	} catch {
		return { role: 'patient', name: '' };
	}
}

function saveAuthFromApi(data: { token?: string; record?: AuthUser; error?: string }) {
	if (!data.token || !data.record) {
		throw new Error(data.error || 'ورود ناموفق بود');
	}
	pb.authStore.save(data.token, data.record as never);
	currentUser = enrichUser(data.record);
	void syncSessionCookie();
	return currentUser;
}

/** Request OTP for login or recovery. */
export async function requestLoginOtp(
	mobile: string,
	mode: 'login' | 'recovery' = 'login'
): Promise<{ role?: UserRole; name?: string; demoCode?: string }> {
	const res = await fetch('/api/auth/otp/request', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ mobile, mode })
	});
	const data = (await res.json()) as {
		error?: string;
		role?: UserRole;
		name?: string;
		demoCode?: string;
	};
	if (!res.ok) throw new Error(data.error || 'ارسال کد ناموفق بود');
	return { role: data.role, name: data.name, demoCode: data.demoCode };
}

/** Verify OTP and complete login/signup/recovery. */
export async function verifyLoginOtp(
	mobile: string,
	code: string,
	opts?: { role?: UserRole; name?: string }
): Promise<AuthUser> {
	const res = await fetch('/api/auth/otp/verify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ mobile, code, role: opts?.role, name: opts?.name })
	});
	const data = (await res.json()) as { token?: string; record?: AuthUser; error?: string };
	if (!res.ok) throw new Error(data.error || 'تأیید کد ناموفق بود');
	return saveAuthFromApi(data);
}

/** Login with username (or email) + password. */
export async function loginWithCredentials(username: string, password: string): Promise<AuthUser> {
	const res = await fetch('/api/auth/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password })
	});
	const data = (await res.json()) as { token?: string; record?: AuthUser; error?: string };
	if (!res.ok) throw new Error(data.error || 'ورود ناموفق بود');
	return saveAuthFromApi(data);
}

/** Provision user via server (admin/secretary only). */
export async function ensureUserViaApi(
	mobile: string,
	role: UserRole,
	name: string
): Promise<AuthUser> {
	const res = await fetch('/api/auth/ensure-user', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
		},
		body: JSON.stringify({ mobile, role, name })
	});
	const data = (await res.json()) as {
		record?: AuthUser;
		error?: string;
	};
	if (!res.ok || !data.record) {
		throw new Error(data.error || 'ایجاد کاربر ناموفق بود');
	}
	return enrichUser(data.record);
}
