import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { canManageAppointments, getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';
import { isZarinpalConfigured } from '$lib/server/payments/zarinpal-config';
import {
	resolveBookingAmountToman,
	startAppointmentCheckout
} from '$lib/server/payments/appointment-checkout';
import { ZarinpalError } from '$lib/server/payments/zarinpal';
import { formatServiceNote } from '$lib/appointments/service-booking';

export const POST: RequestHandler = async ({ request, url }) => {
	const user = await getAuthUserFromRequest(request);
	if (!user) return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	if (!canManageAppointments(user.role)) {
		return json({ error: 'دسترسی ندارید' }, { status: 403 });
	}
	if (!isZarinpalConfigured()) {
		return json({ error: 'درگاه پرداخت آنلاین هنوز فعال نشده است' }, { status: 503 });
	}

	try {
		const body = await request.json();
		const patientId = String(body.patientId ?? '');
		const doctorId = String(body.doctorId ?? '');
		const dateTime = String(body.dateTime ?? '');
		const type = body.type === 'service' ? 'service' : 'in_person';
		const notesPublic = body.notesPublic ? String(body.notesPublic) : '';
		const serviceTitle = body.serviceTitle ? String(body.serviceTitle) : '';
		const servicePriceToman = body.servicePriceToman != null ? Number(body.servicePriceToman) : 0;

		if (!patientId || !doctorId || !dateTime) {
			return json({ error: 'اطلاعات نوبت ناقص است' }, { status: 400 });
		}

		if (user.role === 'patient' && patientId !== user.id) {
			return json({ error: 'فقط برای خودتان می‌توانید پرداخت کنید' }, { status: 403 });
		}

		const pb = await getAdminPb();
		const amountToman = await resolveBookingAmountToman(pb, {
			doctorId,
			type,
			servicePriceToman
		});

		if (amountToman <= 0) {
			return json({ error: 'مبلغ قابل پرداخت برای این نوبت تعریف نشده است' }, { status: 400 });
		}

		let title = 'پرداخت نوبت هومبان';
		if (type === 'service' && serviceTitle) {
			title = `پرداخت خدمت ${serviceTitle}`;
		} else {
			try {
				const doctor = await pb.collection('doctors').getOne(doctorId);
				const doctorName = String(doctor.display_name || 'متخصص');
				title = `پرداخت ویزیت ${doctorName}`;
			} catch {
				/* keep default title */
			}
		}

		let mobile: string | undefined;
		let email: string | undefined;
		try {
			const patient = await pb.collection('users').getOne(patientId);
			mobile = patient.mobile ? String(patient.mobile) : undefined;
			email = patient.email ? String(patient.email) : undefined;
		} catch {
			/* optional metadata */
		}

		const checkout = await startAppointmentCheckout(pb, {
			patientId,
			doctorId,
			dateTime,
			type,
			notesPublic:
				notesPublic ||
				(type === 'service' && serviceTitle
					? formatServiceNote({ title: serviceTitle })
					: undefined),
			amountToman,
			title,
			mobile,
			email,
			origin: url.origin
		});

		return json({
			paymentUrl: checkout.paymentUrl,
			authority: checkout.authority,
			appointmentId: checkout.appointmentId,
			transactionId: checkout.transactionId,
			amountToman
		});
	} catch (err: unknown) {
		if (err instanceof ZarinpalError) {
			return json({ error: err.message }, { status: 502 });
		}
		const message = err instanceof Error ? err.message : 'خطا در شروع پرداخت';
		return json({ error: message }, { status: 500 });
	}
};
