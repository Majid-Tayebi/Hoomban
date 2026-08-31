import type PocketBase from 'pocketbase';

export type StaffRole = 'patient' | 'doctor' | 'secretary' | 'admin' | 'writer';

const STAFF_ROLES: StaffRole[] = ['admin', 'secretary', 'doctor', 'writer'];

export function isStaffRole(role: string): role is Exclude<StaffRole, 'patient'> {
	return (STAFF_ROLES as string[]).includes(role);
}

export function userEmailForMobile(mobile: string): string {
	return `user_${mobile}@hoomban.com`;
}

/** Authoritative role lookup: staff_registry → existing users record → patient. */
export async function resolveStaffRoleForMobile(
	pb: PocketBase,
	mobile: string
): Promise<{ role: StaffRole; name: string }> {
	try {
		const staff = await pb.collection('staff_registry').getList(1, 1, {
			filter: `mobile = "${mobile}" && active = true`
		});
		if (staff.items.length > 0) {
			const item = staff.items[0];
			return {
				role: String(item.role || 'patient') as StaffRole,
				name: String(item.name || '')
			};
		}
	} catch {
		/* continue */
	}

	for (const filter of [`mobile = "${mobile}"`, `email = "${userEmailForMobile(mobile)}"`]) {
		try {
			const user = await pb.collection('users').getFirstListItem(filter);
			const role = String(user.role || 'patient') as StaffRole;
			const name = String(user.name || '');
			if (isStaffRole(role)) {
				return { role, name };
			}
			if (role === 'patient') {
				return { role: 'patient', name };
			}
		} catch {
			/* try next filter */
		}
	}

	return { role: 'patient', name: '' };
}

export function mergeLoginIdentity(
	existing: { role?: string; name?: string; mobile?: string } | null,
	resolved: { role: StaffRole; name: string },
	requested: { role: StaffRole; name: string; mobile?: string }
): { role: StaffRole; name: string } {
	let role = resolved.role;
	let name = resolved.name || requested.name;

	if (existing?.role && isStaffRole(String(existing.role)) && role === 'patient') {
		role = String(existing.role) as StaffRole;
	}

	if (existing?.name?.trim()) {
		const trimmed = existing.name.trim();
		const autoPatient = requested.mobile ? `مراجع ${requested.mobile.slice(-4)}` : '';
		if (!name || (autoPatient && trimmed !== autoPatient)) {
			name = trimmed;
		}
	}

	return { role, name };
}
