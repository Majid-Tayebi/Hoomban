import { env } from '$env/dynamic/private';
import type { SmsTemplate } from '$lib/sms';
import {
	APPT_TEMPLATE_DB_FIELDS,
	loadSmsSettingsFromDb,
	type ApptTemplateDbField
} from '$lib/server/sms/sms-settings';
import { APPT_TEMPLATE_FIELDS } from '$lib/settings/sms-pattern-suggestions';

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

const ENV_TEMPLATE_KEYS: Record<ApptTemplateDbField, string> = {
	tpl_appt_confirmed_patient: 'SMSIR_TEMPLATE_APPT_CONFIRMED_PATIENT',
	tpl_appt_confirmed_doctor: 'SMSIR_TEMPLATE_APPT_CONFIRMED_DOCTOR',
	tpl_appt_cancelled_patient: 'SMSIR_TEMPLATE_APPT_CANCELLED_PATIENT',
	tpl_appt_rescheduled_patient: 'SMSIR_TEMPLATE_APPT_RESCHEDULED_PATIENT',
	tpl_appt_rescheduled_doctor: 'SMSIR_TEMPLATE_APPT_RESCHEDULED_DOCTOR',
	tpl_appt_reminder_patient: 'SMSIR_TEMPLATE_APPT_REMINDER_PATIENT',
	tpl_appt_reminder_doctor: 'SMSIR_TEMPLATE_APPT_REMINDER_DOCTOR'
};

export type ResolvedSmsConfig = {
	apiKey: string;
	lineNumber: number | null;
	otpTemplateId: number;
	otpParam: string;
	appointmentTemplateIds: Partial<Record<SmsTemplate, number>>;
};

function envStr(key: string): string {
	return String(env[key] || '').trim();
}

function parsePositiveInt(raw: string): number | null {
	if (!raw) return null;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : null;
}

function prefer(dbValue: string, envValue: string): string {
	return dbValue.trim() || envValue.trim();
}

/** DB first, then env. */
export async function resolveSmsConfig(): Promise<ResolvedSmsConfig> {
	const db = await loadSmsSettingsFromDb();

	const apiKey = prefer(db.apiKey, envStr('SMSIR_API_KEY'));
	const lineRaw = prefer(db.lineNumber, envStr('SMSIR_LINE_NUMBER'));
	const otpRaw = prefer(db.otpTemplateId, envStr('SMSIR_TEMPLATE_OTP') || '123456');
	const otpParam =
		prefer(db.otpParam, envStr('SMSIR_VERIFY_PARAM')) || 'CODE';

	const appointmentTemplateIds: Partial<Record<SmsTemplate, number>> = {};
	for (const [template, field] of Object.entries(APPT_TEMPLATE_DB_FIELDS) as [
		SmsTemplate,
		ApptTemplateDbField
	][]) {
		if (!APPT_TEMPLATE_FIELDS.includes(field)) continue;
		const raw = prefer(db.templates[field], envStr(ENV_TEMPLATE_KEYS[field]));
		const id = parsePositiveInt(raw);
		if (id != null) appointmentTemplateIds[template] = id;
	}

	return {
		apiKey,
		lineNumber: parsePositiveInt(lineRaw),
		otpTemplateId: parsePositiveInt(otpRaw) ?? 123456,
		otpParam,
		appointmentTemplateIds
	};
}

/** @deprecated Prefer resolveSmsConfig — sync env-only fallback for rare sync paths. */
export function getSmsirApiKey(): string {
	return envStr('SMSIR_API_KEY');
}

export function getSmsirLineNumber(): number | null {
	return parsePositiveInt(envStr('SMSIR_LINE_NUMBER'));
}

export function getSmsirOtpTemplateId(): number {
	return parsePositiveInt(envStr('SMSIR_TEMPLATE_OTP') || '123456') ?? 123456;
}

export function getSmsirVerifyParamName(): string {
	return envStr('SMSIR_VERIFY_PARAM') || 'CODE';
}

export function isSmsirSandbox(): boolean {
	const raw = String(env.SMSIR_SANDBOX ?? 'true').trim().toLowerCase();
	return raw !== 'false' && raw !== '0' && raw !== 'no';
}

/** When true, SMS is only dispatched if app URLs point to localhost (safe for dev keys). */
export function isSmsirLocalOnly(): boolean {
	const raw = String(env.SMSIR_LOCAL_ONLY ?? 'true').trim().toLowerCase();
	return raw !== 'false' && raw !== '0' && raw !== 'no';
}

export async function isSmsirConfigured(): Promise<boolean> {
	const cfg = await resolveSmsConfig();
	return cfg.apiKey.length > 0;
}

/** Bulk (appointment) texts need a dedicated line number from SMS.ir panel. */
export async function isSmsirBulkConfigured(): Promise<boolean> {
	const cfg = await resolveSmsConfig();
	return cfg.apiKey.length > 0 && cfg.lineNumber != null;
}

/** Dev/Sandbox: record appointment SMS without calling Bulk when line number is missing. */
export async function shouldStubBulkSms(): Promise<boolean> {
	const cfg = await resolveSmsConfig();
	if (!cfg.apiKey) return false;
	if (cfg.lineNumber) return false;
	return isSmsirSandbox() || (isSmsirLocalOnly() && isLocalHostEnvironment());
}

function hostFromUrl(raw: string): string | null {
	try {
		return new URL(raw).hostname.toLowerCase();
	} catch {
		return null;
	}
}

export function isLocalHostEnvironment(): boolean {
	const candidates = [env.PUBLIC_APP_URL, env.POCKETBASE_URL, env.ORIGIN].filter(Boolean);
	if (!candidates.length) return true;
	return candidates.some((url) => {
		const host = hostFromUrl(String(url));
		return host != null && LOCAL_HOSTS.has(host);
	});
}

export async function isSmsDispatchAllowed(): Promise<boolean> {
	const cfg = await resolveSmsConfig();
	if (!cfg.apiKey) return false;
	if (isSmsirLocalOnly() && !isLocalHostEnvironment()) return false;
	return true;
}

export function getSmsirApiBase(): string {
	return 'https://api.sms.ir/v1';
}

export function getAppointmentVerifyTemplateId(
	cfg: ResolvedSmsConfig,
	template: string
): number | null {
	if (!(template in APPT_TEMPLATE_DB_FIELDS)) return null;
	return cfg.appointmentTemplateIds[template as SmsTemplate] ?? null;
}
