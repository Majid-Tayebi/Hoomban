import { pb } from '$lib/pocketbase';

export {
	canCancelAppointmentStatus,
	canManageAppointmentActions,
	canPatientCancelAppointment,
	canPatientEditAppointment,
	canRescheduleAppointmentStatus
} from '$lib/appointments/appointment-acl';

function authHeaders(): HeadersInit {
	return {
		'Content-Type': 'application/json',
		...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
	};
}

function apiErrorMessage(error: string | undefined, fallback: string): string {
	if (!error) return fallback;
	if (/auto[\s-]?cancel/i.test(error)) {
		return 'درخواست قبلی لغو شد — لطفاً دوباره تلاش کنید';
	}
	return error;
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
	if (!pb.authStore.token) {
		throw new Error('لطفاً دوباره وارد شوید');
	}
	const res = await fetch(`/api/appointments/${appointmentId}`, {
		method: 'PATCH',
		headers: authHeaders(),
		body: JSON.stringify({ status: 'cancelled' })
	});
	const data = (await res.json()) as { error?: string };
	if (!res.ok) {
		throw new Error(apiErrorMessage(data.error, 'لغو نوبت ناموفق بود'));
	}
}

export async function rescheduleAppointment(appointmentId: string, dateTime: string): Promise<void> {
	if (!pb.authStore.token) {
		throw new Error('لطفاً دوباره وارد شوید');
	}
	const res = await fetch(`/api/appointments/${appointmentId}`, {
		method: 'PATCH',
		headers: authHeaders(),
		body: JSON.stringify({ dateTime })
	});
	const data = (await res.json()) as { error?: string };
	if (!res.ok) {
		throw new Error(apiErrorMessage(data.error, 'تغییر زمان نوبت ناموفق بود'));
	}
}

export async function updatePatientAppointment(
	appointmentId: string,
	params: { dateTime: string; doctorId?: string }
): Promise<void> {
	if (!pb.authStore.token) {
		throw new Error('لطفاً دوباره وارد شوید');
	}
	const res = await fetch(`/api/appointments/${appointmentId}`, {
		method: 'PATCH',
		headers: authHeaders(),
		body: JSON.stringify(params)
	});
	const data = (await res.json()) as { error?: string };
	if (!res.ok) {
		throw new Error(apiErrorMessage(data.error, 'ویرایش نوبت ناموفق بود'));
	}
}
