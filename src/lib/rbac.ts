import type { UserRole } from '$lib/auth.svelte';

export type RouteAccess = {
	path: string;
	roles: UserRole[] | '*';
};

/** Dashboard sub-routes and allowed roles. Patients are blocked from staff modules. */
export const DASHBOARD_ROUTE_ACCESS: RouteAccess[] = [
	{ path: '/dashboard/appointments', roles: ['admin', 'secretary', 'doctor', 'patient'] },
	{ path: '/dashboard/calendar', roles: ['admin', 'secretary'] },
	{ path: '/dashboard/desk', roles: ['admin', 'secretary'] },
	{ path: '/dashboard/patients', roles: ['admin', 'doctor'] },
	{ path: '/dashboard/doctors', roles: ['admin', 'secretary'] },
	{ path: '/dashboard/articles', roles: ['admin', 'writer', 'secretary'] },
	{ path: '/dashboard/services', roles: ['admin', 'secretary'] },
	{ path: '/dashboard/inventory', roles: ['admin', 'secretary'] },
	{ path: '/dashboard/messages', roles: ['admin', 'secretary', 'doctor'] },
	{ path: '/dashboard/departments', roles: ['admin', 'secretary'] },
	{ path: '/dashboard/tests', roles: ['writer', 'admin'] },
	{ path: '/dashboard/schedule', roles: ['doctor', 'admin'] },
	{ path: '/dashboard/admin', roles: ['admin'] },
	{ path: '/dashboard/settings', roles: ['admin'] },
	{ path: '/dashboard/profile', roles: ['admin', 'secretary', 'doctor', 'writer', 'patient'] }
];

export function canAccessPath(pathname: string, role?: string | null): boolean {
	if (!role) return false;
	if (pathname === '/dashboard' || pathname === '/dashboard/') return true;
	if (pathname.startsWith('/dashboard/help')) return true;

	for (const rule of DASHBOARD_ROUTE_ACCESS) {
		if (pathname === rule.path || pathname.startsWith(rule.path + '/')) {
			if (rule.roles === '*') return true;
			return (rule.roles as string[]).includes(role);
		}
	}

	// Unknown dashboard paths: deny by default (explicit whitelist above)
	if (pathname.startsWith('/dashboard')) {
		return false;
	}
	return true;
}

/** Full patient record (profile + clinical notes): admin + doctor only. */
export function canAccessPatientRecord(role?: string | null): boolean {
	return role === 'admin' || role === 'doctor';
}

/** Clinical notes: doctor creates, admin may view. Secretary never. */
export function canViewClinicalNotes(role?: string | null): boolean {
	return role === 'admin' || role === 'doctor';
}

/** Clinical notes write: doctor only (admin views). */
export function canWriteClinicalNotes(role?: string | null): boolean {
	return role === 'doctor';
}


/** Edit referral/profile fields on patient record: admin + doctor. */
export function canEditPatientProfile(role?: string | null): boolean {
	return role === 'admin' || role === 'doctor';
}

/** Create/update psych tests and questions — writer only (enforced in PocketBase too). */
export function canEditPsychTests(role?: string | null): boolean {
	return role === 'writer';
}

/** View psych test editor (read-only for admin). */
export function canViewPsychTestsDashboard(role?: string | null): boolean {
	return role === 'writer' || role === 'admin';
}

/** Secretary desk: contact + appointments + payments (no clinical notes). */
export function canAccessSecretaryPatientDesk(role?: string | null): boolean {
	return role === 'admin' || role === 'secretary';
}

/** Open patient file from an appointment row (doctor → clinical record, secretary → desk). */
export function canNavigateToPatientFromAppointment(role?: string | null): boolean {
	return canAccessPatientRecord(role) || canAccessSecretaryPatientDesk(role);
}

/** Route to open a patient file based on role. */
export type PatientRecordFrom = 'accounting' | 'appointments';

export function getPatientRecordHref(
	patientUserId: string,
	role?: string | null,
	from?: PatientRecordFrom
): string {
	let href: string;
	if (canAccessPatientRecord(role)) {
		href = `/dashboard/patients/${patientUserId}`;
	} else if (canAccessSecretaryPatientDesk(role)) {
		href = `/dashboard/desk/patients/${patientUserId}`;
	} else {
		return '/dashboard';
	}

	if (from && canAccessSecretaryPatientDesk(role)) {
		return `${href}?from=${from}`;
	}
	return href;
}
