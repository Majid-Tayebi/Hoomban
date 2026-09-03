import {
	canPatientCancelByTime,
	PATIENT_CANCEL_MIN_HOURS
} from '$lib/appointments/cancellation-policy';

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
