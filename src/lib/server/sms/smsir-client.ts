import {
	getSmsirApiBase,
	getSmsirApiKey,
	getSmsirLineNumber
} from '$lib/server/sms/smsir-config';

export class SmsIrError extends Error {
	statusCode?: number;

	constructor(message: string, statusCode?: number) {
		super(message);
		this.name = 'SmsIrError';
		this.statusCode = statusCode;
	}
}

type SmsIrEnvelope<T> = {
	status?: number;
	message?: string;
	data?: T;
};

export function toSmsIrMobile(raw: string): string {
	let digits = raw.replace(/\D/g, '');
	if (digits.startsWith('98') && digits.length === 12) digits = digits.slice(2);
	if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
	return digits;
}

function parseEnvelope<T>(json: SmsIrEnvelope<T>): T {
	if (json.status !== 1) {
		throw new SmsIrError(json.message || 'ارسال پیامک ناموفق بود', json.status);
	}
	if (json.data === undefined || json.data === null) {
		throw new SmsIrError(json.message || 'پاسخ نامعتبر از SMS.ir');
	}
	return json.data;
}

async function smsirPost<T>(path: string, body: unknown): Promise<T> {
	const apiKey = getSmsirApiKey();
	if (!apiKey) {
		throw new SmsIrError('کلید SMS.ir تنظیم نشده است');
	}

	const res = await fetch(`${getSmsirApiBase()}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'X-API-KEY': apiKey
		},
		body: JSON.stringify(body)
	});

	const json = (await res.json()) as SmsIrEnvelope<T>;

	if (!res.ok) {
		throw new SmsIrError(json.message || `خطای HTTP ${res.status}`, json.status ?? res.status);
	}

	return parseEnvelope(json);
}

export async function smsirVerifySend(params: {
	mobile: string;
	templateId: number;
	parameters: { name: string; value: string }[];
}): Promise<{ messageId: number; cost?: number }> {
	const mobile = toSmsIrMobile(params.mobile);
	if (mobile.length < 10) {
		throw new SmsIrError('شماره موبایل نامعتبر است');
	}

	return smsirPost('/send/verify', {
		mobile,
		templateId: params.templateId,
		parameters: params.parameters
	});
}

export async function smsirBulkSend(params: {
	mobiles: string[];
	messageText: string;
	sendDateTime?: number | null;
}): Promise<{ packId: string; messageIds: (number | null)[]; cost?: number }> {
	const lineNumber = getSmsirLineNumber();
	if (!lineNumber) {
		throw new SmsIrError('شماره خط SMS.ir (SMSIR_LINE_NUMBER) تنظیم نشده است');
	}

	const mobiles = params.mobiles.map(toSmsIrMobile).filter((m) => m.length >= 10);
	if (!mobiles.length) {
		throw new SmsIrError('لیست گیرندگان خالی است');
	}

	return smsirPost('/send/bulk', {
		lineNumber,
		messageText: params.messageText,
		mobiles,
		sendDateTime: params.sendDateTime ?? null
	});
}

export async function smsirGetCredit(): Promise<number> {
	const apiKey = getSmsirApiKey();
	if (!apiKey) throw new SmsIrError('کلید SMS.ir تنظیم نشده است');

	const res = await fetch(`${getSmsirApiBase()}/credit`, {
		headers: { Accept: 'application/json', 'X-API-KEY': apiKey }
	});
	const json = (await res.json()) as SmsIrEnvelope<number>;
	if (!res.ok) {
		throw new SmsIrError(json.message || `خطای HTTP ${res.status}`, json.status ?? res.status);
	}
	return parseEnvelope(json);
}
