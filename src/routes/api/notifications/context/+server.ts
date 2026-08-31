import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { formatFaDateTime } from '$lib/date';

const STATUS_LABELS: Record<string, string> = {
	completed: 'تکمیل‌شده',
	cancelled: 'لغو‌شده',
	confirmed: 'تأیید‌شده',
	reserved: 'رزرو',
	pending: 'در انتظار'
};

export const GET: RequestHandler = async ({ request, url }) => {
	const user = await getAuthUserFromRequest(request);
	if (!user) {
		return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	}

	const appointmentId = String(url.searchParams.get('appointmentId') || '').trim();
	if (!appointmentId) {
		return json({ error: 'شناسه نوبت نامعتبر است' }, { status: 400 });
	}

	try {
		const pb = await getAdminPb();
		const apt = await pb.collection('appointments').getOne(appointmentId, {
			expand: 'patient,doctor',
			...PB_NO_AUTO_CANCEL
		});

		const exp = apt.expand as {
			patient?: { name?: string };
			doctor?: { display_name?: string; specialty?: string };
		};
		const status = String(apt.status || '');
		const type = String(apt.type || 'in_person');

		return json({
			patientName: exp.patient?.name || 'مراجع',
			doctorName: exp.doctor?.display_name || 'متخصص',
			specialty: exp.doctor?.specialty || 'روانشناسی',
			dateTimeLabel: formatFaDateTime(new Date(String(apt.date_time))),
			statusLabel: STATUS_LABELS[status] || status,
			typeLabel: type === 'online' ? 'آنلاین' : 'حضوری'
		});
	} catch {
		return json({ error: 'نوبت یافت نشد' }, { status: 404 });
	}
};
