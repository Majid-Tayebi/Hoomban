import type PocketBase from 'pocketbase';
import type { SmsTemplate } from '$lib/sms';
import {
	APPT_TEMPLATE_FIELD_BY_SMS,
	APPT_TEMPLATE_FIELDS,
	type ApptTemplateField
} from '$lib/settings/sms-pattern-suggestions';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';

export const SMS_SETTINGS_KEY = 'main';

export type ApptTemplateDbField = ApptTemplateField;

export const APPT_TEMPLATE_DB_FIELDS = APPT_TEMPLATE_FIELD_BY_SMS as Record<
	SmsTemplate,
	ApptTemplateDbField
>;

export type SmsSettingsRecord = {
	recordId: string | null;
	apiKey: string;
	lineNumber: string;
	otpTemplateId: string;
	otpParam: string;
	templates: Record<ApptTemplateDbField, string>;
};

export type SmsSettingsPublicView = {
	hasApiKey: boolean;
	apiKeyMasked: string;
	lineNumber: string;
	otpTemplateId: string;
	otpParam: string;
	templates: Record<ApptTemplateDbField, string>;
};

export type SmsSettingsPatch = {
	apiKey?: string;
	lineNumber?: string;
	otpTemplateId?: string;
	otpParam?: string;
	templates?: Partial<Record<ApptTemplateDbField, string>>;
};

const EMPTY_TEMPLATES = (): Record<ApptTemplateDbField, string> => {
	const templates = {} as Record<ApptTemplateDbField, string>;
	for (const field of APPT_TEMPLATE_FIELDS) {
		templates[field] = '';
	}
	return templates;
};

const CACHE_TTL_MS = 10_000;
let cache: { at: number; value: SmsSettingsRecord } | null = null;

export function invalidateSmsSettingsCache() {
	cache = null;
}

export function maskApiKey(apiKey: string): string {
	const key = apiKey.trim();
	if (!key) return '';
	if (key.length <= 4) return '••••';
	return `••••${key.slice(-4)}`;
}

export function toPublicSmsSettings(record: SmsSettingsRecord): SmsSettingsPublicView {
	return {
		hasApiKey: record.apiKey.length > 0,
		apiKeyMasked: maskApiKey(record.apiKey),
		lineNumber: record.lineNumber,
		otpTemplateId: record.otpTemplateId,
		otpParam: record.otpParam || 'CODE',
		templates: { ...record.templates }
	};
}

function str(raw: unknown): string {
	return String(raw ?? '').trim();
}

function mapRecord(row: Record<string, unknown> & { id?: string }): SmsSettingsRecord {
	const templates = EMPTY_TEMPLATES();
	for (const field of APPT_TEMPLATE_FIELDS) {
		templates[field] = str(row[field]);
	}
	return {
		recordId: row.id ? String(row.id) : null,
		apiKey: str(row.api_key),
		lineNumber: str(row.line_number),
		otpTemplateId: str(row.otp_template_id),
		otpParam: str(row.otp_param),
		templates
	};
}

async function ensureMainRecord(pb: PocketBase) {
	try {
		return await pb
			.collection('sms_settings')
			.getFirstListItem(`key = "${SMS_SETTINGS_KEY}"`, PB_NO_AUTO_CANCEL);
	} catch {
		return await pb.collection('sms_settings').create(
			{
				key: SMS_SETTINGS_KEY,
				otp_param: 'CODE'
			},
			PB_NO_AUTO_CANCEL
		);
	}
}

/** Load raw settings from PocketBase (admin client). Empty if collection missing. */
export async function loadSmsSettingsFromDb(pb?: PocketBase): Promise<SmsSettingsRecord> {
	if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
		return cache.value;
	}

	try {
		const client = pb ?? (await getAdminPb());
		const row = await client
			.collection('sms_settings')
			.getFirstListItem(`key = "${SMS_SETTINGS_KEY}"`, PB_NO_AUTO_CANCEL);
		const value = mapRecord(row as never);
		cache = { at: Date.now(), value };
		return value;
	} catch {
		const empty: SmsSettingsRecord = {
			recordId: null,
			apiKey: '',
			lineNumber: '',
			otpTemplateId: '',
			otpParam: '',
			templates: EMPTY_TEMPLATES()
		};
		cache = { at: Date.now(), value: empty };
		return empty;
	}
}

export async function updateSmsSettings(patch: SmsSettingsPatch): Promise<SmsSettingsPublicView> {
	const pb = await getAdminPb();
	const record = await ensureMainRecord(pb);

	const payload: Record<string, string> = {};

	if (patch.apiKey !== undefined) {
		const next = String(patch.apiKey).trim();
		// Empty string keeps previous key.
		if (next) payload.api_key = next;
	}
	if (patch.lineNumber !== undefined) {
		payload.line_number = String(patch.lineNumber).trim();
	}
	if (patch.otpTemplateId !== undefined) {
		payload.otp_template_id = String(patch.otpTemplateId).trim();
	}
	if (patch.otpParam !== undefined) {
		payload.otp_param = String(patch.otpParam).trim() || 'CODE';
	}
	if (patch.templates) {
		for (const field of APPT_TEMPLATE_FIELDS) {
			if (patch.templates[field] !== undefined) {
				payload[field] = String(patch.templates[field]).trim();
			}
		}
	}

	const updated = await pb.collection('sms_settings').update(record.id, payload, PB_NO_AUTO_CANCEL);
	invalidateSmsSettingsCache();
	const value = mapRecord(updated as never);
	cache = { at: Date.now(), value };
	return toPublicSmsSettings(value);
}
