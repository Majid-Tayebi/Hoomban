import type { AuthUser } from '$lib/auth.svelte';
import { loadPatientDetail } from '$lib/patients/detail';
import type { PatientAppointmentRow } from '$lib/patients/detail/types';
import { buildCareTimeline } from '$lib/patients/detail/care-timeline';
import { loadPatientAccounting } from './accounting';
import type { PatientDeskData } from '../types';
import { formatToman } from '../types';

function formatFaDate(d: Date): string {
	return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildDeskMeta(
	appointments: PatientAppointmentRow[],
	accounting: Awaited<ReturnType<typeof loadPatientAccounting>>
): { label: string; value: string }[] {
	const sorted = [...appointments].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
	const firstVisit = sorted[0];
	const firstSpecialist = sorted.find((a) => a.kind === 'specialist');
	const timeline = buildCareTimeline(appointments);
	const currentSpecialist = [...timeline].reverse().find((e) => e.kind === 'specialist');

	return [
		{
			label: 'تاریخ اولین مراجعه',
			value: firstVisit ? formatFaDate(firstVisit.dateTime) : '—'
		},
		{
			label: 'اولین متخصص',
			value: firstSpecialist?.specialistName || '—'
		},
		{
			label: 'متخصص فعلی',
			value: currentSpecialist?.title || '—'
		},
		{
			label: 'جمع هزینه‌ها',
			value: formatToman(accounting.summary.totalExpected)
		},
		{
			label: 'پرداخت‌شده',
			value: formatToman(accounting.summary.totalPaid)
		},
		{
			label: 'مانده حساب',
			value: formatToman(accounting.summary.balance)
		}
	];
}

export async function loadPatientDesk(patientId: string, user: AuthUser): Promise<PatientDeskData> {
	if (!user) throw new Error('User is required');

	const [{ data }, accounting] = await Promise.all([
		loadPatientDetail(patientId, user, false),
		loadPatientAccounting(patientId)
	]);

	return {
		id: data.id,
		name: data.name,
		patientCode: data.patientCode,
		contact: {
			phone: data.contact.phone,
			email: data.contact.email,
			emergencyContact: data.contact.emergencyContact
		},
		meta: buildDeskMeta(data.appointments, accounting),
		appointments: data.appointments,
		accounting
	};
}

/** Reload only accounting + profile meta after a payment change. */
export async function refreshPatientDeskAccounting(
	patientId: string,
	appointments: PatientAppointmentRow[]
): Promise<Pick<PatientDeskData, 'accounting' | 'meta'>> {
	const accounting = await loadPatientAccounting(patientId);
	return {
		accounting,
		meta: buildDeskMeta(appointments, accounting)
	};
}
