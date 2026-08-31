import { browser, dev } from '$app/environment';

const PUSH_DISMISSED_KEY = 'hoomban-push-dismissed';

export type PushSupportState = {
	supported: boolean;
	configured: boolean;
	permission: NotificationPermission | 'unsupported';
	subscribed: boolean;
	loading: boolean;
	error: string;
};

export function isPushSupported(): boolean {
	return (
		browser &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}

function authHeaders(token: string): HeadersInit {
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(base64);
	const output = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
	return output;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (!isPushSupported()) return null;

	const registration = await navigator.serviceWorker.register('/service-worker.js', {
		type: dev ? 'module' : 'classic',
		scope: '/'
	});
	await navigator.serviceWorker.ready;
	return registration;
}

export async function fetchVapidPublicKey(): Promise<string | null> {
	const res = await fetch('/api/push/vapid-public-key');
	if (!res.ok) return null;
	const data = (await res.json()) as { configured?: boolean; publicKey?: string | null };
	if (!data.configured || !data.publicKey) return null;
	return data.publicKey;
}

export async function getActivePushSubscription(): Promise<PushSubscription | null> {
	if (!isPushSupported()) return null;
	const registration = await navigator.serviceWorker.getRegistration('/');
	return registration?.pushManager.getSubscription() ?? null;
}

export async function subscribeToPush(token: string): Promise<void> {
	if (!isPushSupported()) throw new Error('مرورگر از Web Push پشتیبانی نمی‌کند');

	const permission = await Notification.requestPermission();
	if (permission !== 'granted') {
		throw new Error('اجازه اعلان مرورگر داده نشد');
	}

	const publicKey = await fetchVapidPublicKey();
	if (!publicKey) throw new Error('Web Push روی سرور فعال نیست');

	const registration = (await navigator.serviceWorker.getRegistration('/')) ?? (await registerServiceWorker());
	if (!registration) throw new Error('Service Worker ثبت نشد');

	let subscription = await registration.pushManager.getSubscription();
	if (!subscription) {
		subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
		});
	}

	const json = subscription.toJSON();
	if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
		throw new Error('اشتراک push نامعتبر است');
	}

	const res = await fetch('/api/push/subscribe', {
		method: 'POST',
		headers: authHeaders(token),
		body: JSON.stringify({
			endpoint: json.endpoint,
			keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
		})
	});

	const data = (await res.json()) as { error?: string };
	if (!res.ok) throw new Error(data.error || 'ثبت اشتراک ناموفق بود');
}

export async function unsubscribeFromPush(token: string): Promise<void> {
	if (!isPushSupported()) return;

	const registration = await navigator.serviceWorker.getRegistration('/');
	const subscription = await registration?.pushManager.getSubscription();
	if (!subscription) return;

	const endpoint = subscription.endpoint;
	await subscription.unsubscribe();

	await fetch('/api/push/unsubscribe', {
		method: 'POST',
		headers: authHeaders(token),
		body: JSON.stringify({ endpoint })
	});
}

export async function sendTestPush(token: string): Promise<{ sent: number; failed: number }> {
	const res = await fetch('/api/push/test', {
		method: 'POST',
		headers: authHeaders(token)
	});
	const data = (await res.json()) as {
		error?: string;
		sent?: number;
		failed?: number;
		ok?: boolean;
	};
	if (!res.ok || data.ok === false) {
		throw new Error(data.error || 'ارسال تست ناموفق بود');
	}
	return { sent: data.sent ?? 0, failed: data.failed ?? 0 };
}

export function wasPushPromptDismissed(): boolean {
	if (!browser) return false;
	try {
		return localStorage.getItem(PUSH_DISMISSED_KEY) === '1';
	} catch {
		return false;
	}
}

export function dismissPushPrompt(): void {
	if (!browser) return;
	try {
		localStorage.setItem(PUSH_DISMISSED_KEY, '1');
	} catch {
		/* ignore */
	}
}

export function clearPushPromptDismissed(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(PUSH_DISMISSED_KEY);
	} catch {
		/* ignore */
	}
}
