import {
	getZarinpalApiBase,
	getZarinpalMerchantId,
	getZarinpalStartPayBase,
	isZarinpalConfigured
} from '$lib/server/payments/zarinpal-config';

export class ZarinpalError extends Error {
	code?: number;

	constructor(message: string, code?: number) {
		super(message);
		this.name = 'ZarinpalError';
		this.code = code;
	}
}

type ZarinpalEnvelope<T> = {
	data?: T;
	errors?: { code?: number; message?: string; validations?: unknown[] } | unknown;
};

export function tomanToRial(amountToman: number): number {
	return Math.round(Math.max(0, amountToman) * 10);
}

export function getZarinpalStartPayUrl(authority: string): string {
	return `${getZarinpalStartPayBase()}/${authority}`;
}

export async function zarinpalRequestPayment(params: {
	amountRial: number;
	description: string;
	callbackUrl: string;
	mobile?: string;
	email?: string;
}): Promise<{ authority: string; fee?: number }> {
	if (!isZarinpalConfigured()) {
		throw new ZarinpalError('درگاه پرداخت هنوز پیکربندی نشده است');
	}
	if (params.amountRial < 1000) {
		throw new ZarinpalError('حداقل مبلغ پرداخت ۱۰۰ تومان است');
	}

	const body: Record<string, unknown> = {
		merchant_id: getZarinpalMerchantId(),
		amount: params.amountRial,
		callback_url: params.callbackUrl,
		description: params.description.slice(0, 255)
	};
	const metadata: Record<string, string> = {};
	if (params.mobile) metadata.mobile = params.mobile;
	if (params.email) metadata.email = params.email;
	if (Object.keys(metadata).length) body.metadata = metadata;

	const res = await fetch(`${getZarinpalApiBase()}/request.json`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(body)
	});

	const json = (await res.json()) as ZarinpalEnvelope<{
		code: number;
		message: string;
		authority: string;
		fee?: number;
	}>;

	if (!res.ok || !json.data) {
		const err = json.errors as { message?: string; code?: number } | undefined;
		throw new ZarinpalError(err?.message || 'خطا در اتصال به زرین‌پال', err?.code);
	}

	if (json.data.code !== 100 || !json.data.authority) {
		throw new ZarinpalError(json.data.message || 'درخواست پرداخت رد شد', json.data.code);
	}

	return { authority: json.data.authority, fee: json.data.fee };
}

export async function zarinpalVerifyPayment(params: {
	amountRial: number;
	authority: string;
}): Promise<{ refId: string; cardPan?: string; fee?: number }> {
	if (!isZarinpalConfigured()) {
		throw new ZarinpalError('درگاه پرداخت هنوز پیکربندی نشده است');
	}

	const res = await fetch(`${getZarinpalApiBase()}/verify.json`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({
			merchant_id: getZarinpalMerchantId(),
			amount: params.amountRial,
			authority: params.authority
		})
	});

	const json = (await res.json()) as ZarinpalEnvelope<{
		code: number;
		message: string;
		ref_id?: number;
		card_pan?: string;
		fee?: number;
	}>;

	if (!res.ok || !json.data) {
		const err = json.errors as { message?: string; code?: number } | undefined;
		throw new ZarinpalError(err?.message || 'خطا در تأیید پرداخت', err?.code);
	}

	if (json.data.code !== 100 && json.data.code !== 101) {
		throw new ZarinpalError(json.data.message || 'پرداخت تأیید نشد', json.data.code);
	}

	const refId = json.data.ref_id != null ? String(json.data.ref_id) : '';
	if (!refId) {
		throw new ZarinpalError('کد پیگیری پرداخت دریافت نشد');
	}

	return { refId, cardPan: json.data.card_pan, fee: json.data.fee };
}
