export type SmsTemplate =
	| 'appointment_confirmed'
	| 'appointment_reminder'
	| 'appointment_rescheduled'
	| 'appointment_cancelled'
	| 'doctor_new_appointment'
	| 'doctor_appointment_reminder'
	| 'doctor_appointment_rescheduled';

export type SendSmsInput = {
	to: string;
	template?: SmsTemplate | 'custom';
	payload?: Record<string, string | number>;
	body?: string;
};

export type SendSmsResult = {
	ok: boolean;
	status: 'queued' | 'sent' | 'failed' | 'stub' | 'pending';
	id?: string;
	error?: string;
};

const TEMPLATE_BODIES: Record<SmsTemplate, (p: Record<string, string | number>) => string> = {
	appointment_confirmed: (p) =>
		`نوبت شما در کلینیک هومبان برای ${p.date ?? ''} ساعت ${p.time ?? ''} با ${p.doctor ?? 'متخصص'} تأیید شد.`,
	appointment_reminder: (p) =>
		`یادآوری: نوبت شما در هومبان ${p.date ?? ''} ساعت ${p.time ?? ''} با ${p.doctor ?? 'متخصص'} است.`,
	appointment_rescheduled: (p) =>
		`زمان نوبت شما در کلینیک هومبان به ${p.date ?? ''} ساعت ${p.time ?? ''} با ${p.doctor ?? 'متخصص'} تغییر کرد.`,
	appointment_cancelled: (p) =>
		`نوبت شما در هومبان برای ${p.date ?? ''} لغو شد. برای رزرو مجدد با کلینیک تماس بگیرید.`,
	doctor_new_appointment: (p) =>
		`نوبت جدید: بیمار ${p.patient ?? ''} در ${p.date ?? ''} ساعت ${p.time ?? ''}.`,
	doctor_appointment_reminder: (p) =>
		`یادآوری: جلسه با بیمار ${p.patient ?? ''} در ${p.date ?? ''} ساعت ${p.time ?? ''}.`,
	doctor_appointment_rescheduled: (p) =>
		`تغییر زمان نوبت: بیمار ${p.patient ?? ''} به ${p.date ?? ''} ساعت ${p.time ?? ''}.`
};

export function renderSmsBody(template: SmsTemplate, payload: Record<string, string | number> = {}) {
	return TEMPLATE_BODIES[template](payload);
}

/**
 * Browser helper only — never talks to SMS.ir and never touches the API key.
 * Proxies to SvelteKit `/api/sms/send`, which queues + dispatches server-side.
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
	const body =
		input.body ||
		(input.template && input.template !== 'custom'
			? renderSmsBody(input.template, input.payload || {})
			: '');
	try {
		const { pb } = await import('$lib/pocketbase');
		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (pb.authStore.token) {
			headers.Authorization = `Bearer ${pb.authStore.token}`;
		}

		const res = await fetch('/api/sms/send', {
			method: 'POST',
			headers,
			credentials: 'include',
			body: JSON.stringify({
				to: input.to,
				template: input.template,
				payload: input.payload,
				body
			})
		});
		const data = (await res.json()) as SendSmsResult & { error?: string };
		if (!res.ok) {
			return { ok: false, status: 'failed', error: data.error || 'ارسال ناموفق' };
		}
		return {
			ok: data.ok,
			status: data.status,
			id: data.id,
			error: data.error
		};
	} catch (e: unknown) {
		return {
			ok: false,
			status: 'failed',
			error: e instanceof Error ? e.message : 'خطای شبکه'
		};
	}
}
