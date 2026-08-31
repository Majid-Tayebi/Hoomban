import type PocketBase from 'pocketbase';
import { generateSecurePassword } from '$lib/server/auth-secrets';
import { getAdminPb, getServerPb } from '$lib/server/pocketbase';
import {
	mergeLoginIdentity,
	resolveStaffRoleForMobile,
	userEmailForMobile,
	isStaffRole,
	type StaffRole
} from '$lib/server/resolve-staff-role';

export type EnsureUserInput = {
	mobile: string;
	role?: StaffRole;
	name?: string;
};

export type AuthPayload = {
	token: string;
	record: Record<string, unknown>;
};

export async function findUserByMobile(pb: PocketBase, mobile: string) {
	const email = userEmailForMobile(mobile);
	for (const filter of [`mobile = "${mobile}"`, `email = "${email}"`]) {
		try {
			return await pb.collection('users').getFirstListItem(filter);
		} catch {
			/* try next */
		}
	}
	return null;
}

type ExistingUser = { id: string; role?: string; name?: string; mobile?: string } | null;

export async function ensureUserRecord(
	pb: PocketBase,
	input: EnsureUserInput
): Promise<{ userId: string; email: string; record: Record<string, unknown> }> {
	const mobile = input.mobile;
	const email = userEmailForMobile(mobile);
	const resolved = await resolveStaffRoleForMobile(pb, mobile);
	const existingRaw = await findUserByMobile(pb, mobile);
	const existing = existingRaw as ExistingUser;

	const identity = mergeLoginIdentity(existing, resolved, {
		role: input.role || 'patient',
		name: input.name || '',
		mobile
	});

	const displayName =
		identity.name ||
		(existing?.name as string | undefined) ||
		(identity.role === 'patient' ? `مراجع ${mobile.slice(-4)}` : 'کاربر');

	let userId: string;
	if (existing) {
		userId = existing.id;
		await pb.collection('users').update(userId, {
			role: identity.role,
			mobile,
			name: displayName
		});
	} else {
		const password = generateSecurePassword();
		const created = await pb.collection('users').create({
			email,
			emailVisibility: true,
			password,
			passwordConfirm: password,
			name: displayName,
			role: identity.role,
			mobile,
			verified: !isStaffRole(identity.role)
		});
		userId = created.id;
	}

	const record = await pb.collection('users').getOne(userId);
	return { userId, email, record: record as Record<string, unknown> };
}

/** Issue auth token via admin impersonation — no shared demo password. */
export async function issueUserAuth(userId: string): Promise<AuthPayload> {
	const adminPb = await getAdminPb();
	getServerPb().authStore.clear();
	const impersonated = await adminPb.collection('users').impersonate(userId, 86400);
	return {
		token: impersonated.authStore.token,
		record: impersonated.authStore.record as Record<string, unknown>
	};
}

export async function ensureUserAndAuth(input: EnsureUserInput): Promise<AuthPayload> {
	const pb = await getAdminPb();
	const { userId } = await ensureUserRecord(pb, input);
	return issueUserAuth(userId);
}
