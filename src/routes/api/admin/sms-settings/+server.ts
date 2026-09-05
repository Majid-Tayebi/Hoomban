import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeAuditLog } from '$lib/server/audit-log';
import { getAdminPb } from '$lib/server/pocketbase';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import {
	APPT_TEMPLATE_DB_FIELDS,
	invalidateSmsSettingsCache,
	loadSmsSettingsFromDb,
	toPublicSmsSettings,
	updateSmsSettings,
	type ApptTemplateDbField,
	type SmsSettingsPatch
} from '$lib/server/sms/sms-settings';

async function requireAdmin(request: Request, cookies: Parameters<typeof getAuthUserFromRequest>[1]) {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user || user.role !== 'admin') return null;
	return user;
}

export const GET: RequestHandler = async ({ request, cookies }) => {
	if (!(await requireAdmin(request, cookies))) {
		return json({ error: 'دسترسی ندارید' }, { status: 403 });
	}

	const record = await loadSmsSettingsFromDb();
	return json({ settings: toPublicSmsSettings(record) });
};

export const PATCH: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const user = await requireAdmin(request, cookies);
	if (!user) {
		return json({ error: 'دسترسی ندارید' }, { status: 403 });
	}

	try {
		const body = (await request.json()) as Record<string, unknown>;
		const patch: SmsSettingsPatch = {};

		if (body.apiKey != null) {
			const rawKey = String(body.apiKey).trim();
			// Ignore masked placeholders / empty — keep stored key.
			if (rawKey && !rawKey.includes('•')) {
				patch.apiKey = rawKey;
			}
		}
		if (body.lineNumber != null) patch.lineNumber = String(body.lineNumber);
		if (body.otpTemplateId != null) patch.otpTemplateId = String(body.otpTemplateId);
		if (body.otpParam != null) patch.otpParam = String(body.otpParam);

		if (body.templates && typeof body.templates === 'object') {
			const templates: Partial<Record<ApptTemplateDbField, string>> = {};
			const raw = body.templates as Record<string, unknown>;
			for (const field of Object.values(APPT_TEMPLATE_DB_FIELDS)) {
				if (raw[field] != null) templates[field] = String(raw[field]);
			}
			patch.templates = templates;
		}

		const settings = await updateSmsSettings(patch);
		invalidateSmsSettingsCache();

		const pb = await getAdminPb();
		await writeAuditLog(pb, {
			actorId: user.id,
			actorRole: user.role,
			action: 'update',
			resource: 'sms_settings',
			resourceId: undefined,
			summary: 'بروزرسانی تنظیمات SMS.ir',
			metadata: {
				hasApiKey: settings.hasApiKey,
				lineNumber: settings.lineNumber,
				otpTemplateId: settings.otpTemplateId,
				otpParam: settings.otpParam
			},
			ip: getClientAddress()
		});

		return json({ settings });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'ذخیره تنظیمات پیامک ناموفق';
		return json({ error: message }, { status: 500 });
	}
};
