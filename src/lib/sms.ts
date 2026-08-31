export type SmsTemplate =
	| 'appointment_confirmed'
	| 'appointment_reminder'
	| 'appointment_cancelled'
	| 'doctor_new_appointment';

export type SendSmsInput = {
	to: string;
	template: SmsTemplate;
	payload?: Record<string, string | number>;
	body?: string;
};

export type SendSmsResult = {
	ok: boolean;
	status: 'queued' | 'sent' | 'failed' | 'stub';
	id?: string;
	error?: string;
};

const TEMPLATE_BODIES: Record<SmsTemplate, (p: Record<string, string | number>) => string> = {
	appointment_confirmed: (p) =>
		`نوبت شما در کلینیک هومبان برای ${p.date ?? ''} ساعت ${p.time ?? ''} با ${p.doctor ?? 'متخصص'} تأیید شد.`,
	appointment_reminder: (p) =>
		`یادآوری: فردا نوبت شما در هومبان ساعت ${p.time ?? ''} با ${p.doctor ?? 'متخصص'} است.`,
	appointment_cancelled: (p) =>
		`نوبت شما در هومبان برای ${p.date ?? ''} لغو شد. برای رزرو مجدد با کلینیک تماس بگیرید.`,
	doctor_new_appointment: (p) =>
		`نوبت جدید: بیمار ${p.patient ?? ''} در ${p.date ?? ''} ساعت ${p.time ?? ''}.`
};

export function renderSmsBody(template: SmsTemplate, payload: Record<string, string | number> = {}) {
	return TEMPLATE_BODIES[template](payload);
}

/**
 * Client helper — posts to /api/sms/send which writes sms_outbox.
 * Real provider (Kavenegar etc.) is not wired yet; status stays stub/queued.
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
	const body = input.body || renderSmsBody(input.template, input.payload || {});
	try {
		const { pb } = await import('$lib/pocketbase');
		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (pb.authStore.token) {
			headers.Authorization = `Bearer ${pb.authStore.token}`;
		}

		const res = await fetch('/api/sms/send', {
			method: 'POST',
			headers,
			body: JSON.stringify({ ...input, body })
		});
		const data = (await res.json()) as SendSmsResult & { error?: string };
		if (!res.ok) {
			return { ok: false, status: 'failed', error: data.error || 'ارسال ناموفق' };
		}
		return data;
	} catch (e: unknown) {
		return {
			ok: false,
			status: 'failed',
			error: e instanceof Error ? e.message : 'خطای شبکه'
		};
	}
}
