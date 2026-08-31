import {
	fetchNotifications,
	hasNotificationAuth,
	markAllNotificationsRead,
	markNotificationRead,
	subscribeNotifications
} from '$lib/notifications/services/notifications-client';
import type { NotificationRecord } from '$lib/notifications/types';
import { pb } from '$lib/pocketbase';

let items = $state<NotificationRecord[]>([]);
let loading = $state(false);
let syncedUserId = $state<string | null>(null);
let unsubscribeRealtime: (() => void) | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pendingUserId = $state<string | null>(null);

export function getUnreadCount() {
	return items.filter((n) => !n.readAt).length;
}

export function getNotifications() {
	return items;
}

export function isNotificationsLoading() {
	return loading;
}

export async function refreshNotifications(): Promise<void> {
	loading = true;
	try {
		items = await fetchNotifications();
	} finally {
		loading = false;
	}
}

export async function readNotification(id: string): Promise<void> {
	const ok = await markNotificationRead(id);
	if (!ok) return;
	items = items.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
}

export async function readAllNotifications(): Promise<void> {
	const ok = await markAllNotificationsRead();
	if (!ok) return;
	const now = new Date().toISOString();
	items = items.map((n) => ({ ...n, readAt: n.readAt ?? now }));
}

export function bindNotifications(userId: string | null | undefined): void {
	if (!userId || userId === 'demo-user') {
		stopNotifications();
		items = [];
		syncedUserId = null;
		pendingUserId = null;
		return;
	}
	if (!hasNotificationAuth()) {
		pendingUserId = userId;
		return;
	}
	pendingUserId = null;
	if (syncedUserId === userId) return;

	stopNotifications();
	syncedUserId = userId;
	void refreshNotifications();

	unsubscribeRealtime = subscribeNotifications(userId, () => {
		void refreshNotifications();
	});

	pollTimer = setInterval(() => {
		void refreshNotifications();
	}, 60_000);
}

export function stopNotifications(): void {
	unsubscribeRealtime?.();
	unsubscribeRealtime = null;
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
}

if (typeof window !== 'undefined') {
	pb.authStore.onChange(() => {
		if (pendingUserId && hasNotificationAuth()) {
			bindNotifications(pendingUserId);
			return;
		}
		const id = syncedUserId;
		if (id && hasNotificationAuth()) {
			void refreshNotifications();
		}
	});
}
