import type PocketBase from 'pocketbase';
import type { PushSubscription } from 'web-push';
import { ensureVapidConfigured, isVapidConfigured, webpush } from './vapid';
import {
	listUserPushSubscriptions,
	removePushSubscriptionById,
	type PushSubscriptionRecord
} from './subscriptions';

export type WebPushPayload = {
	title: string;
	body?: string;
	href?: string;
	tag?: string;
};

function toWebPushSubscription(record: PushSubscriptionRecord): PushSubscription {
	return {
		endpoint: record.endpoint,
		keys: {
			p256dh: record.p256dh,
			auth: record.auth
		}
	};
}

function isExpiredSubscriptionError(err: unknown): boolean {
	if (!err || typeof err !== 'object') return false;
	const status = (err as { statusCode?: number }).statusCode;
	return status === 404 || status === 410;
}

/** Send Web Push to all active subscriptions for a user (best-effort, non-blocking errors logged). */
export async function sendWebPushToUser(
	pb: PocketBase,
	userId: string,
	payload: WebPushPayload
): Promise<{ sent: number; failed: number; removed: number }> {
	if (!isVapidConfigured()) {
		return { sent: 0, failed: 0, removed: 0 };
	}

	ensureVapidConfigured();

	const subs = await listUserPushSubscriptions(pb, userId);
	if (!subs.length) return { sent: 0, failed: 0, removed: 0 };

	const body = JSON.stringify({
		title: payload.title,
		body: payload.body ?? '',
		href: payload.href ?? '/dashboard',
		tag: payload.tag ?? `hoomban-${Date.now()}`
	});

	let sent = 0;
	let failed = 0;
	let removed = 0;

	for (const sub of subs) {
		try {
			await webpush.sendNotification(toWebPushSubscription(sub), body, {
				TTL: 60 * 60 * 24,
				urgency: 'normal'
			});
			sent += 1;
		} catch (err) {
			if (isExpiredSubscriptionError(err)) {
				await removePushSubscriptionById(pb, sub.id);
				removed += 1;
			} else {
				console.error('web push failed:', sub.id, err);
				failed += 1;
			}
		}
	}

	return { sent, failed, removed };
}
