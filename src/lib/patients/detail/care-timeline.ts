import type { PatientAppointmentRow, PatientReferralRow } from './types';

export type CareTimelineEntry = {
	id: string;
	from: Date;
	to: Date | null;
	kind: 'specialist' | 'service' | 'referral';
	title: string;
	subtitle: string;
};

function formatFaDateShort(d: Date): string {
	return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildAppointmentTimeline(appointments: PatientAppointmentRow[]): CareTimelineEntry[] {
	const sorted = [...appointments].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
	const entries: CareTimelineEntry[] = [];
	let activeSpecialist: CareTimelineEntry | null = null;

	for (const apt of sorted) {
		if (apt.kind === 'service') {
			entries.push({
				id: `service-${apt.id}`,
				from: apt.dateTime,
				to: apt.dateTime,
				kind: 'service',
				title: apt.serviceName || 'خدمت',
				subtitle: 'نوبت خدمات'
			});
			continue;
		}

		const specialist = apt.specialistName?.trim();
		if (!specialist) continue;

		if (!activeSpecialist || activeSpecialist.title !== specialist) {
			if (activeSpecialist) {
				activeSpecialist.to = apt.dateTime;
			}
			activeSpecialist = {
				id: `specialist-${apt.id}`,
				from: apt.dateTime,
				to: null,
				kind: 'specialist',
				title: specialist,
				subtitle: 'مسئول پرونده'
			};
			entries.push(activeSpecialist);
		}
	}

	return entries;
}

function buildReferralTimeline(referrals: PatientReferralRow[]): CareTimelineEntry[] {
	return referrals.map((referral) => ({
		id: `referral-${referral.id}`,
		from: new Date(referral.created),
		to: null,
		kind: 'referral' as const,
		title: `ارجاع به ${referral.toDoctorName}`,
		subtitle: `از ${referral.fromDoctorName} · ${referral.reason}`
	}));
}

/** Build care timeline from appointments and formal referrals. */
export function buildCareTimeline(
	appointments: PatientAppointmentRow[],
	referrals: PatientReferralRow[] = []
): CareTimelineEntry[] {
	const entries = [...buildAppointmentTimeline(appointments), ...buildReferralTimeline(referrals)];
	return entries.sort((a, b) => a.from.getTime() - b.from.getTime());
}

export function formatCarePeriod(entry: CareTimelineEntry): string {
	const from = formatFaDateShort(entry.from);
	if (entry.kind === 'service' || entry.kind === 'referral' || !entry.to || entry.from.getTime() === entry.to.getTime()) {
		return from;
	}
	return `${from} — ${formatFaDateShort(entry.to)}`;
}
