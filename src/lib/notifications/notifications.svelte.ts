import {
	fetchNotifications,
	hasNotificationAuth,
	markAllNotificationsRead,
	markNotificationRead,
	subscribeNotifications
} from '$lib/notifications/services/notifications-client';
import type { NotificationRecord } from '$lib/notifications/types';
import { sortNotificationsNewestFirst } from '$lib/notifications/sort';
import { pb } from '$lib/pocketbase';

let items = $state<NotificationRecord[]>([]);
let toastQueue = $state<NotificationRecord[]>([]);
let bellAttention = $state(false);
let loading = $state(false);
let syncedUserId = $state<string | null>(null);
let unsubscribeRealtime: (() => void) | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pendingUserId = $state<string | null>(null);
let knownNotificationIds = new Set<string>();
let notificationsPrimed = false;
let bellAttentionTimer: ReturnType<typeof setTimeout> | null = null;
let refreshDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const MAX_TOASTS = 4;
const POLL_MS = 12_000;

export function getUnreadCount() {
	return items.filter((n) => !n.readAt).length;
}

export function getNotifications() {
	return items;
}

export function getNotificationToasts() {
	return toastQueue;
}

export function getBellAttention() {
	return bellAttention;
}

export function dismissNotificationToast(id: string): void {
	toastQueue = toastQueue.filter((t) => t.id !== id);
}

export function clearBellAttention(): void {
	bellAttention = false;
	if (bellAttentionTimer) {
		clearTimeout(bellAttentionTimer);
		bellAttentionTimer = null;
	}
}

export function isNotificationsLoading() {
	return loading;
}

function resetNotificationTracking(): void {
	notificationsPrimed = false;
	knownNotificationIds = new Set();
	toastQueue = [];
	clearBellAttention();
}

function primeNotifications(list: NotificationRecord[]): void {
	knownNotificationIds = new Set(list.map((n) => n.id));
	notificationsPrimed = true;
}

function maybeShowBrowserNotification(item: NotificationRecord): void {
	if (typeof window === 'undefined' || !document.hidden) return;
	if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
	try {
		new Notification(item.title, {
			body: item.body || undefined,
			tag: item.id
		});
	} catch {
		/* ignore */
	}
}

function queueIncomingNotifications(incoming: NotificationRecord[]): void {
	const unreadIncoming = incoming.filter((n) => !n.readAt);
	if (!unreadIncoming.length) return;

	const merged = [...unreadIncoming, ...toastQueue].filter(
		(item, index, all) => all.findIndex((x) => x.id === item.id) === index
	);
	toastQueue = merged.slice(0, MAX_TOASTS);
	bellAttention = true;

	if (bellAttentionTimer) clearTimeout(bellAttentionTimer);
	bellAttentionTimer = setTimeout(() => {
		bellAttention = false;
		bellAttentionTimer = null;
	}, 12_000);

	maybeShowBrowserNotification(unreadIncoming[0]);
}

function detectIncoming(next: NotificationRecord[]): void {
	if (!notificationsPrimed) {
		primeNotifications(next);
		return;
	}

	const incoming = next.filter((n) => !knownNotificationIds.has(n.id));
	knownNotificationIds = new Set(next.map((n) => n.id));
	queueIncomingNotifications(incoming);
}

export async function refreshNotifications(): Promise<void> {
	loading = true;
	try {
		const next = sortNotificationsNewestFirst(await fetchNotifications());
		detectIncoming(next);
		items = next;
	} finally {
		loading = false;
	}
}

function scheduleRefreshNotifications(): void {
	if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer);
	refreshDebounceTimer = setTimeout(() => {
		refreshDebounceTimer = null;
		void refreshNotifications();
	}, 200);
}

export async function readNotification(id: string): Promise<void> {
	const ok = await markNotificationRead(id);
	if (!ok) return;
	items = sortNotificationsNewestFirst(
		items.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
	);
	dismissNotificationToast(id);
	if (!getUnreadCount()) clearBellAttention();
}

export async function readAllNotifications(): Promise<void> {
	const ok = await markAllNotificationsRead();
	if (!ok) return;
	const now = new Date().toISOString();
	items = items.map((n) => ({ ...n, readAt: n.readAt ?? now }));
	toastQueue = [];
	clearBellAttention();
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
	resetNotificationTracking();
	void refreshNotifications();

	unsubscribeRealtime = subscribeNotifications(userId, scheduleRefreshNotifications);

	pollTimer = setInterval(() => {
		void refreshNotifications();
	}, POLL_MS);
}

export function bindServiceWorkerPush(): () => void {
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => {};

	const handler = (event: MessageEvent) => {
		if (event.data?.type !== 'hoomban-push') return;
		void refreshNotifications();
	};

	navigator.serviceWorker.addEventListener('message', handler);
	return () => navigator.serviceWorker.removeEventListener('message', handler);
}

export function stopNotifications(): void {
	unsubscribeRealtime?.();
	unsubscribeRealtime = null;
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
	if (refreshDebounceTimer) {
		clearTimeout(refreshDebounceTimer);
		refreshDebounceTimer = null;
	}
	resetNotificationTracking();
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
