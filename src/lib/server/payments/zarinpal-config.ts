import { env } from '$env/dynamic/private';

export function getZarinpalMerchantId(): string {
	return String(env.ZARINPAL_MERCHANT_ID || '').trim();
}

export function isZarinpalSandbox(): boolean {
	const raw = String(env.ZARINPAL_SANDBOX ?? 'true').trim().toLowerCase();
	return raw !== 'false' && raw !== '0' && raw !== 'no';
}

export function isZarinpalConfigured(): boolean {
	return getZarinpalMerchantId().length > 0;
}

export function getPublicAppUrl(fallbackOrigin?: string): string {
	const configured = String(env.PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
	if (configured) return configured;
	if (fallbackOrigin) return fallbackOrigin.replace(/\/+$/, '');
	return 'http://127.0.0.1:5173';
}

export function getZarinpalCallbackUrl(origin?: string): string {
	const explicit = String(env.ZARINPAL_CALLBACK_URL || '').trim();
	if (explicit) return explicit;
	return `${getPublicAppUrl(origin)}/api/payments/zarinpal/callback`;
}

export function getZarinpalApiBase(): string {
	return isZarinpalSandbox()
		? 'https://sandbox.zarinpal.com/pg/v4/payment'
		: 'https://api.zarinpal.com/pg/v4/payment';
}

export function getZarinpalStartPayBase(): string {
	return isZarinpalSandbox()
		? 'https://sandbox.zarinpal.com/pg/StartPay'
		: 'https://www.zarinpal.com/pg/StartPay';
}
