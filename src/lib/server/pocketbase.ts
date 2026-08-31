import { env } from '$env/dynamic/private';
import PocketBase from 'pocketbase';

const PB_URL = env.POCKETBASE_URL || 'http://127.0.0.1:8090';

/** Prevent parallel server requests on one client from aborting each other. */
export const PB_NO_AUTO_CANCEL = { $autoCancel: false as const };

/** PocketBase client authenticated as superuser for privileged server ops. */
export async function getAdminPb(): Promise<PocketBase> {
	const email = env.POCKETBASE_ADMIN_EMAIL;
	const password = env.POCKETBASE_ADMIN_PASSWORD;
	if (!email || !password) {
		throw new Error('POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD تنظیم نشده است');
	}
	const pb = new PocketBase(PB_URL);
	try {
		await pb.collection('_superusers').authWithPassword(email, password);
	} catch {
		// Older PB / SDK: admins API
		await (pb as unknown as { admins: { authWithPassword: (e: string, p: string) => Promise<unknown> } }).admins.authWithPassword(
			email,
			password
		);
	}
	return pb;
}

export function getServerPb(): PocketBase {
	return new PocketBase(PB_URL);
}
