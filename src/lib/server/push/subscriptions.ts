import type PocketBase from 'pocketbase';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';

export type PushSubscriptionRecord = {
	id: string;
	user: string;
	endpoint: string;
	p256dh: string;
	auth: string;
	enabled?: boolean;
};

export type PushSubscriptionInput = {
	endpoint: string;
	keys: { p256dh: string; auth: string };
};

export async function upsertPushSubscription(
	pb: PocketBase,
	userId: string,
	input: PushSubscriptionInput,
	userAgent?: string
): Promise<void> {
	const endpoint = input.endpoint.trim();
	if (!endpoint || !input.keys.p256dh || !input.keys.auth) {
		throw new Error('اشتراک push نامعتبر است');
	}

	let existing: { id: string } | null = null;
	try {
		const res = await pb.collection('push_subscriptions').getList(1, 1, {
			filter: `endpoint = ${JSON.stringify(endpoint)}`,
			fields: 'id',
			...PB_NO_AUTO_CANCEL
		});
		existing = res.items[0] ? { id: res.items[0].id } : null;
	} catch {
		existing = null;
	}

	const payload = {
		user: userId,
		endpoint,
		p256dh: input.keys.p256dh,
		auth: input.keys.auth,
		user_agent: userAgent?.slice(0, 500) ?? '',
		enabled: true
	};

	if (existing) {
		await pb.collection('push_subscriptions').update(existing.id, payload, PB_NO_AUTO_CANCEL);
	} else {
		await pb.collection('push_subscriptions').create(payload, PB_NO_AUTO_CANCEL);
	}
}

export async function deletePushSubscription(
	pb: PocketBase,
	userId: string,
	endpoint: string
): Promise<void> {
	const trimmed = endpoint.trim();
	if (!trimmed) return;

	try {
		const res = await pb.collection('push_subscriptions').getList(1, 5, {
			filter: `user = ${JSON.stringify(userId)} && endpoint = ${JSON.stringify(trimmed)}`,
			fields: 'id',
			...PB_NO_AUTO_CANCEL
		});
		for (const item of res.items) {
			await pb.collection('push_subscriptions').delete(item.id, PB_NO_AUTO_CANCEL);
		}
	} catch {
		/* ignore */
	}
}

export async function listUserPushSubscriptions(
	pb: PocketBase,
	userId: string
): Promise<PushSubscriptionRecord[]> {
	const res = await pb.collection('push_subscriptions').getFullList({
		filter: `user = ${JSON.stringify(userId)} && enabled = true`,
		...PB_NO_AUTO_CANCEL
	});
	return res.map((row) => ({
		id: row.id,
		user: String(row.user),
		endpoint: String(row.endpoint),
		p256dh: String(row.p256dh),
		auth: String(row.auth),
		enabled: row.enabled !== false
	}));
}

export async function removePushSubscriptionById(pb: PocketBase, id: string): Promise<void> {
	try {
		await pb.collection('push_subscriptions').delete(id, PB_NO_AUTO_CANCEL);
	} catch {
		/* ignore */
	}
}
