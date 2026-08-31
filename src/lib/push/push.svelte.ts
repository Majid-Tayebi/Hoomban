import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase';
import {
	dismissPushPrompt,
	fetchVapidPublicKey,
	getActivePushSubscription,
	isPushSupported,
	registerServiceWorker,
	subscribeToPush,
	unsubscribeFromPush,
	wasPushPromptDismissed
} from './push-client';

let pushSupported = $state(false);
let pushConfigured = $state(false);
let pushPermission = $state<NotificationPermission | 'unsupported'>('unsupported');
let pushSubscribed = $state(false);
let pushLoading = $state(false);
let pushError = $state('');
let pushPromptVisible = $state(false);
let initialized = false;

async function refreshPushState(): Promise<void> {
	if (!browser || !isPushSupported()) {
		pushSupported = false;
		pushConfigured = false;
		pushPermission = 'unsupported';
		pushSubscribed = false;
		return;
	}

	pushSupported = true;
	pushPermission = Notification.permission;

	const publicKey = await fetchVapidPublicKey();
	pushConfigured = Boolean(publicKey);

	const sub = await getActivePushSubscription();
	pushSubscribed = Boolean(sub);
}

export function getPushSupported(): boolean {
	return pushSupported;
}

export function isPushConfigured(): boolean {
	return pushConfigured;
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
	return pushPermission;
}

export function isPushSubscribed(): boolean {
	return pushSubscribed;
}

export function isPushLoading(): boolean {
	return pushLoading;
}

export function getPushError(): string {
	return pushError;
}

export function isPushPromptVisible(): boolean {
	return pushPromptVisible;
}

export async function initPushForUser(userId: string | undefined): Promise<void> {
	if (!browser || !userId || userId === 'demo-user') return;
	if (!pb.authStore.token) return;

	try {
		await registerServiceWorker();
	} catch (err) {
		console.warn('service worker registration failed:', err);
	}

	await refreshPushState();

	if (
		pushSupported &&
		pushConfigured &&
		pushPermission === 'default' &&
		!wasPushPromptDismissed() &&
		!pushSubscribed
	) {
		pushPromptVisible = true;
	}

	initialized = true;
}

export async function enablePushNotifications(): Promise<boolean> {
	if (!pb.authStore.token) {
		pushError = 'لطفاً دوباره وارد شوید';
		return false;
	}

	pushLoading = true;
	pushError = '';
	try {
		await subscribeToPush(pb.authStore.token);
		pushPromptVisible = false;
		await refreshPushState();
		return true;
	} catch (err) {
		pushError = err instanceof Error ? err.message : 'فعال‌سازی push ناموفق بود';
		return false;
	} finally {
		pushLoading = false;
	}
}

export async function disablePushNotifications(): Promise<void> {
	if (!pb.authStore.token) return;
	pushLoading = true;
	pushError = '';
	try {
		await unsubscribeFromPush(pb.authStore.token);
		await refreshPushState();
	} catch (err) {
		pushError = err instanceof Error ? err.message : 'غیرفعال‌سازی push ناموفق بود';
	} finally {
		pushLoading = false;
	}
}

export function hidePushPrompt(): void {
	pushPromptVisible = false;
	dismissPushPrompt();
}

export async function refreshPushNotifications(): Promise<void> {
	if (!initialized) return;
	await refreshPushState();
}

export { sendTestPush } from './push-client';
