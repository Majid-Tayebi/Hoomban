import {
	getSmsirApiBase,
	resolveSmsConfig,
	type ResolvedSmsConfig
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

/** SMS.ir HTTP must never run in the browser (API key stays on SvelteKit server only). */
function assertServerSideSmsIr() {
	if (typeof window !== 'undefined') {
		throw new SmsIrError('فراخوانی SMS.ir فقط از سرور مجاز است');
	}
}

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

async function smsirPost<T>(
	path: string,
	body: unknown,
	cfg?: ResolvedSmsConfig
): Promise<T> {
	assertServerSideSmsIr();
	const config = cfg ?? (await resolveSmsConfig());
	if (!config.apiKey) {
		throw new SmsIrError('کلید SMS.ir تنظیم نشده است');
	}

	const res = await fetch(`${getSmsirApiBase()}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'X-API-KEY': config.apiKey
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
	config?: ResolvedSmsConfig;
}): Promise<{ messageId: number; cost?: number }> {
	const mobile = toSmsIrMobile(params.mobile);
	if (mobile.length < 10) {
		throw new SmsIrError('شماره موبایل نامعتبر است');
	}

	return smsirPost(
		'/send/verify',
		{
			mobile,
			templateId: params.templateId,
			parameters: params.parameters
		},
		params.config
	);
}

export async function smsirBulkSend(params: {
	mobiles: string[];
	messageText: string;
	sendDateTime?: number | null;
	config?: ResolvedSmsConfig;
}): Promise<{ packId: string; messageIds: (number | null)[]; cost?: number }> {
	const config = params.config ?? (await resolveSmsConfig());
	if (!config.lineNumber) {
		throw new SmsIrError('شماره خط SMS.ir تنظیم نشده است');
	}

	const mobiles = params.mobiles.map(toSmsIrMobile).filter((m) => m.length >= 10);
	if (!mobiles.length) {
		throw new SmsIrError('لیست گیرندگان خالی است');
	}

	return smsirPost(
		'/send/bulk',
		{
			lineNumber: config.lineNumber,
			messageText: params.messageText,
			mobiles,
			sendDateTime: params.sendDateTime ?? null
		},
		config
	);
}

export async function smsirGetCredit(config?: ResolvedSmsConfig): Promise<number> {
	assertServerSideSmsIr();
	const cfg = config ?? (await resolveSmsConfig());
	if (!cfg.apiKey) throw new SmsIrError('کلید SMS.ir تنظیم نشده است');

	const res = await fetch(`${getSmsirApiBase()}/credit`, {
		headers: { Accept: 'application/json', 'X-API-KEY': cfg.apiKey }
	});
	const json = (await res.json()) as SmsIrEnvelope<number>;
	if (!res.ok) {
		throw new SmsIrError(json.message || `خطای HTTP ${res.status}`, json.status ?? res.status);
	}
	return parseEnvelope(json);
}
