import { env } from '$env/dynamic/private';
import webpush from 'web-push';

let configured = false;

export function isVapidConfigured(): boolean {
	return Boolean(
		env.VAPID_PUBLIC_KEY?.trim() &&
			env.VAPID_PRIVATE_KEY?.trim() &&
			env.VAPID_SUBJECT?.trim()
	);
}

export function getVapidPublicKey(): string | null {
	const key = env.VAPID_PUBLIC_KEY?.trim();
	return key || null;
}

export function ensureVapidConfigured(): void {
	if (configured) return;
	if (!isVapidConfigured()) {
		throw new Error('VAPID keys تنظیم نشده‌اند');
	}
	webpush.setVapidDetails(
		env.VAPID_SUBJECT!.trim(),
		env.VAPID_PUBLIC_KEY!.trim(),
		env.VAPID_PRIVATE_KEY!.trim()
	);
	configured = true;
}

export { webpush };
