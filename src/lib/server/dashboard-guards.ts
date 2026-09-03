import { redirect } from '@sveltejs/kit';
import type { SessionUser } from '$lib/server/session';
import {
	canAccessPatientRecord,
	canAccessSecretaryPatientDesk,
	canViewPsychTestsDashboard
} from '$lib/rbac';

function deny(redirectTo = '/dashboard'): never {
	throw redirect(303, redirectTo);
}

export function requireUser(user: SessionUser | null): SessionUser {
	if (!user) deny('/auth');
	return user;
}

export function requireRoles(user: SessionUser | null, roles: string[]): SessionUser {
	const u = requireUser(user);
	if (!roles.includes(u.role)) deny();
	return u;
}

export function requirePatientRecordAccess(user: SessionUser | null): SessionUser {
	const u = requireUser(user);
	if (!canAccessPatientRecord(u.role)) deny();
	return u;
}

export function requireClinicalRecordAccess(user: SessionUser | null): SessionUser {
	const u = requireUser(user);
	if (!canAccessPatientRecord(u.role)) deny();
	return u;
}

export function requireSecretaryDeskAccess(user: SessionUser | null): SessionUser {
	const u = requireUser(user);
	if (!canAccessSecretaryPatientDesk(u.role)) deny();
	return u;
}

export function requirePsychTestsDashboard(user: SessionUser | null): SessionUser {
	const u = requireUser(user);
	if (!canViewPsychTestsDashboard(u.role)) deny();
	return u;
}

export function requireAdmin(user: SessionUser | null): SessionUser {
	return requireRoles(user, ['admin']);
}
