import { pb } from '$lib/pocketbase';
import {
	canPatientCancelByTime,
	PATIENT_CANCEL_MIN_HOURS
} from '$lib/appointments/cancellation-policy';

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

export function canRescheduleAppointmentStatus(status: string): boolean {
	return canCancelAppointmentStatus(status);
}

export function canCancelAppointmentStatus(status: string): boolean {
	return status !== 'cancelled' && status !== 'completed';
}

export function canManageAppointmentActions(role?: string | null): boolean {
	return role === 'admin' || role === 'secretary' || role === 'doctor';
}

export function canPatientEditAppointment(
	role?: string | null,
	patientUserId?: string,
	currentUserId?: string,
	status?: string
): boolean {
	return (
		role === 'patient' &&
		Boolean(patientUserId && currentUserId && patientUserId === currentUserId) &&
		canRescheduleAppointmentStatus(status || '')
	);
}

export function canPatientCancelAppointment(
	role?: string | null,
	patientUserId?: string,
	currentUserId?: string,
	status?: string,
	dateTime?: Date | string,
	minHours = PATIENT_CANCEL_MIN_HOURS
): boolean {
	return (
		role === 'patient' &&
		Boolean(patientUserId && currentUserId && patientUserId === currentUserId) &&
		canCancelAppointmentStatus(status || '') &&
		Boolean(dateTime && canPatientCancelByTime(dateTime, minHours))
	);
}
