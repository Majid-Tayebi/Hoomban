import { pb } from '$lib/pocketbase';
import { mapNotificationRecord, type NotificationRecord } from '$lib/notifications/types';
import { sortNotificationsNewestFirst } from '$lib/notifications/sort';

function authHeaders(): HeadersInit {
	const token = pb.authStore.token;
	return {
		'Content-Type': 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {})
	};
}

export function hasNotificationAuth(): boolean {
	return pb.authStore.isValid && Boolean(pb.authStore.token);
}

export async function fetchNotifications(limit = 30): Promise<NotificationRecord[]> {
	if (!hasNotificationAuth()) return [];
	const res = await fetch(`/api/notifications?limit=${limit}`, {
		headers: authHeaders()
	});
	if (!res.ok) return [];
	const data = (await res.json()) as { items?: NotificationRecord[] };
	return sortNotificationsNewestFirst(data.items ?? []);
}

export async function markNotificationRead(id: string): Promise<boolean> {
	const res = await fetch(`/api/notifications/${id}/read`, {
		method: 'PATCH',
		headers: authHeaders()
	});
	return res.ok;
}

export async function markAllNotificationsRead(): Promise<boolean> {
	const res = await fetch('/api/notifications/read-all', {
		method: 'POST',
		headers: authHeaders()
	});
	return res.ok;
}

function recordRecipientId(record: Record<string, unknown> | undefined): string | null {
	if (!record) return null;
	const recipient = record.recipient;
	if (typeof recipient === 'string') return recipient;
	if (recipient && typeof recipient === 'object' && 'id' in recipient) {
		return String((recipient as { id?: string }).id || '');
	}
	return null;
}

export function subscribeNotifications(userId: string, onChange: () => void): () => void {
	if (!userId || userId === 'demo-user') return () => {};

	let unsub: (() => void) | null = null;

	void pb
		.collection('notifications')
		.subscribe('*', (e) => {
			const recipientId = recordRecipientId(e.record as Record<string, unknown> | undefined);
			if (recipientId === userId) onChange();
		})
		.then((fn) => {
			unsub = fn;
		})
		.catch(() => {
			/* Realtime unavailable — polling fallback handled by caller */
		});

	return () => {
		unsub?.();
	};
}

export { mapNotificationRecord };
