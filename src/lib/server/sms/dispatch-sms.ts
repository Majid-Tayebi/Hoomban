import type PocketBase from 'pocketbase';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import {
	getAppointmentVerifyTemplateId,
	isSmsDispatchAllowed,
	isSmsirConfigured,
	isSmsirLocalOnly,
	isSmsirSandbox,
	resolveSmsConfig,
	shouldStubBulkSms
} from '$lib/server/sms/smsir-config';
import { smsirBulkSend, smsirVerifySend, SmsIrError } from '$lib/server/sms/smsir-client';

export type SmsDispatchStatus = 'sent' | 'failed' | 'stub' | 'queued';

export type SmsDispatchResult = {
	status: SmsDispatchStatus;
	messageId?: number;
	packId?: string;
	error?: string;
};

const OTP_TEMPLATES = new Set(['otp_login', 'otp_recovery', 'otp_mobile_change']);
const DEFAULT_SITE_LABEL = 'هومبان';

function extractOtpCode(payload: Record<string, unknown>, body: string): string | null {
	const fromPayload = payload.code ?? payload.Code ?? payload.CODE ?? payload.otp;
	if (fromPayload != null && String(fromPayload).trim()) {
		return String(fromPayload).trim().slice(0, 25);
	}
	const match = body.match(/\d{4,8}/);
	return match?.[0] ?? null;
}

function isOtpTemplate(template: string): boolean {
	return OTP_TEMPLATES.has(template);
}

function payloadStr(payload: Record<string, unknown>, ...keys: string[]): string {
	for (const key of keys) {
		const v = payload[key];
		if (v != null && String(v).trim()) return String(v).trim().slice(0, 25);
	}
	return '';
}

function resolveSiteLabel(payload: Record<string, unknown>): string {
	const fromPayload = payloadStr(payload, 'site', 'Site');
	return fromPayload || DEFAULT_SITE_LABEL;
}

function buildAppointmentVerifyParams(
	payload: Record<string, unknown>,
	site: string
): { name: string; value: string }[] {
	const params: { name: string; value: string }[] = [
		{ name: 'Date', value: payloadStr(payload, 'date', 'Date') || '-' },
		{ name: 'Time', value: payloadStr(payload, 'time', 'Time') || '-' },
		{ name: 'Site', value: site }
	];
	const doctor = payloadStr(payload, 'doctor', 'Doctor');
	const patient = payloadStr(payload, 'patient', 'Patient');
	if (doctor) params.push({ name: 'Doctor', value: doctor });
	if (patient) params.push({ name: 'Patient', value: patient });
	return params;
}

export async function dispatchSmsOutbox(
	pb: PocketBase,
	record: {
		id: string;
		to?: string;
		template?: string;
		body?: string;
		payload?: Record<string, unknown> | null;
	}
): Promise<SmsDispatchResult> {
	if (!(await isSmsirConfigured())) {
		return { status: 'stub', error: 'SMS.ir پیکربندی نشده' };
	}

	if (!(await isSmsDispatchAllowed())) {
		const hint = isSmsirLocalOnly()
			? 'ارسال واقعی فقط در محیط localhost فعال است (SMSIR_LOCAL_ONLY)'
			: 'ارسال پیامک غیرفعال است';
		return { status: 'queued', error: hint };
	}

	const to = String(record.to ?? '');
	const template = String(record.template ?? '');
	const body = String(record.body ?? '');
	const payload = (record.payload ?? {}) as Record<string, unknown>;
	const cfg = await resolveSmsConfig();

	try {
		if (isOtpTemplate(template)) {
			const code = extractOtpCode(payload, body);
			if (!code) {
				throw new SmsIrError('کد OTP برای ارسال یافت نشد');
			}

			const result = await smsirVerifySend({
				mobile: to,
				templateId: cfg.otpTemplateId,
				parameters: [{ name: cfg.otpParam, value: code }],
				config: cfg
			});

			await pb.collection('sms_outbox').update(
				record.id,
				{
					status: 'sent',
					error: isSmsirSandbox() ? 'Sandbox — بدون ارسال واقعی' : '',
					payload: {
						...payload,
						provider: 'sms.ir',
						sandboxSimulated: isSmsirSandbox(),
						messageId: result.messageId,
						cost: result.cost,
						verifyTemplateId: cfg.otpTemplateId
					}
				},
				PB_NO_AUTO_CANCEL
			);

			return { status: 'sent', messageId: result.messageId };
		}

		const apptTemplateId = getAppointmentVerifyTemplateId(cfg, template);
		if (apptTemplateId != null) {
			const site = resolveSiteLabel(payload);
			const result = await smsirVerifySend({
				mobile: to,
				templateId: apptTemplateId,
				parameters: buildAppointmentVerifyParams(payload, site),
				config: cfg
			});

			await pb.collection('sms_outbox').update(
				record.id,
				{
					status: 'sent',
					error: isSmsirSandbox() ? 'Sandbox — بدون ارسال واقعی' : '',
					payload: {
						...payload,
						provider: 'sms.ir',
						sandboxSimulated: isSmsirSandbox(),
						messageId: result.messageId,
						cost: result.cost,
						verifyTemplateId: apptTemplateId,
						site
					}
				},
				PB_NO_AUTO_CANCEL
			);

			return { status: 'sent', messageId: result.messageId };
		}

		if (!body.trim()) {
			throw new SmsIrError('متن پیامک خالی است');
		}

		if (await shouldStubBulkSms()) {
			await pb.collection('sms_outbox').update(
				record.id,
				{
					status: 'sent',
					error: 'Sandbox — خط SMS.ir تنظیم نشده؛ متن در outbox ثبت شد',
					payload: {
						...payload,
						provider: 'sms.ir',
						sandboxSimulated: true,
						bulkStub: true,
						messageText: body
					}
				},
				PB_NO_AUTO_CANCEL
			);
			return { status: 'sent' };
		}

		const result = await smsirBulkSend({ mobiles: [to], messageText: body, config: cfg });

		await pb.collection('sms_outbox').update(
			record.id,
			{
				status: 'sent',
				error: isSmsirSandbox() ? 'Sandbox — بدون ارسال واقعی' : '',
				payload: {
					...payload,
					provider: 'sms.ir',
					sandboxSimulated: isSmsirSandbox(),
					packId: result.packId,
					messageIds: result.messageIds,
					cost: result.cost
				}
			},
			PB_NO_AUTO_CANCEL
		);

		return { status: 'sent', packId: result.packId };
	} catch (err: unknown) {
		const message = err instanceof SmsIrError ? err.message : err instanceof Error ? err.message : 'خطای ارسال';
		try {
			await pb.collection('sms_outbox').update(
				record.id,
				{ status: 'failed', error: message.slice(0, 500) },
				PB_NO_AUTO_CANCEL
			);
		} catch {
			/* ignore update failure */
		}
		return { status: 'failed', error: message };
	}
}
