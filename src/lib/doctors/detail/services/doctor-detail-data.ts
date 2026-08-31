import { pb } from '$lib/pocketbase';
import type { AuthUser } from '$lib/auth.svelte';
import type {
	DoctorDetailData,
	DoctorPatientRow,
	DoctorScheduleSlot
} from '../types';
import {
	MOCK_FEEDBACK,
	MOCK_STATS,
	buildDemoDoctorDetail
} from '../data/mock-data';
import { formatPatientCodeFromUser } from '$lib/patients/patient-code';

function formatDoctorCode(id: string): string {
	return `DR-${id.slice(-4).toUpperCase()}`;
}

function formatTimeRange(d: Date, minutes = 45): string {
	const start = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
	const end = new Date(d.getTime() + minutes * 60 * 1000).toLocaleTimeString('fa-IR', {
		hour: '2-digit',
		minute: '2-digit'
	});
	return `${start} – ${end}`;
}

function initials(name: string): string {
	return name
		.split(' ')
		.map((w) => w.charAt(0))
		.slice(0, 2)
		.join('.');
}

function mapType(type: string): string {
	return type === 'online' ? 'آنلاین' : 'مشاوره';
}

function mapPatientStatus(index: number): DoctorPatientRow['status'] {
	const statuses: DoctorPatientRow['status'][] = ['in_treatment', 'admitted', 'discharged'];
	return statuses[index % statuses.length];
}

export function getDoctorDetailPhotoUrl(id: string, photo?: string): string | null {
	if (!photo) return null;
	return pb.files.getURL(
		{ id, collectionId: 'pbc_656799828', collectionName: 'doctors' } as never,
		photo
	);
}

export async function loadDoctorDetail(
	doctorId: string,
	_user: AuthUser
): Promise<DoctorDetailData> {
	if (!doctorId || doctorId.length < 5) {
		return buildDemoDoctorDetail(doctorId || 'demo');
	}

	try {
		const doc = await pb.collection('doctors').getOne(doctorId, { expand: 'user' });
		const exp = doc.expand as { user?: { name?: string; email?: string; mobile?: string } } | undefined;
		const name = String(doc.display_name || exp?.user?.name || 'متخصص');
		const isActive = doc.is_active !== false;
		const slotDuration = Number(doc.slot_duration || 45);

		let schedule: DoctorScheduleSlot[] = [];
		let patients: DoctorPatientRow[] = [];

		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);

			const aptRes = await pb.collection('appointments').getList(1, 30, {
				filter: `doctor = "${doctorId}" && date_time >= "${today.toISOString()}" && date_time < "${tomorrow.toISOString()}"`,
				expand: 'patient',
				sort: 'date_time'
			});

			schedule = aptRes.items.map((a) => {
				const p = (a.expand as { patient?: { name?: string } } | undefined)?.patient;
				const patientName = String(p?.name || 'بیمار');
				const dateTime = new Date(String(a.date_time));
				return {
					id: a.id,
					patientName,
					patientInitials: initials(patientName),
					type: mapType(String(a.type)),
					timeRange: formatTimeRange(dateTime, slotDuration)
				};
			});
		} catch {
			schedule = buildDemoDoctorDetail(doctorId).schedule;
		}

		try {
			const allApts = await pb.collection('appointments').getList(1, 100, {
				filter: `doctor = "${doctorId}"`,
				expand: 'patient',
				sort: '-date_time'
			});

			const map = new Map<string, DoctorPatientRow>();
			let i = 0;
			for (const a of allApts.items) {
				const p = (a.expand as { patient?: { id?: string; name?: string } } | undefined)?.patient;
				if (!p?.id || map.has(p.id)) continue;
				const patientName = String(p.name || 'بیمار');
				map.set(p.id, {
					id: p.id,
					name: patientName,
					patientCode: formatPatientCodeFromUser(p.id, a.date_time ? String(a.date_time) : null, i),
					checkInDate: new Date(String(a.date_time)).toLocaleDateString('fa-IR', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					}),
					condition: 'مشاوره',
					treatment: 'پیگیری تخصصی',
					status: mapPatientStatus(i)
				});
				i += 1;
			}
			patients = [...map.values()].slice(0, 10);
			if (!patients.length) patients = buildDemoDoctorDetail(doctorId).patients;
		} catch {
			patients = buildDemoDoctorDetail(doctorId).patients;
		}

		const demo = buildDemoDoctorDetail(doctorId);

		return {
			profile: {
				id: doctorId,
				code: formatDoctorCode(doctorId),
				displayName: name,
				specialty: String(doc.specialty || 'روانشناسی'),
				experience: demo.profile.experience,
				availability: isActive ? 'available' : 'unavailable',
				photo: doc.photo ? String(doc.photo) : undefined,
				bio: String(doc.bio || demo.profile.bio),
				room: demo.profile.room,
				phone: String(exp?.user?.mobile || demo.profile.phone),
				email: String(exp?.user?.email || demo.profile.email),
				joinDate: demo.profile.joinDate,
				emergencyContact: demo.profile.emergencyContact,
				address: demo.profile.address,
				visitFee: Number(doc.visit_fee || 0),
				slotDuration
			},
			satisfaction: demo.satisfaction,
			stats: [
				{
					...MOCK_STATS[0],
					value: Math.max(schedule.length * 40, MOCK_STATS[0].value)
				},
				{
					...MOCK_STATS[1],
					value: Math.max(patients.length * 20, MOCK_STATS[1].value)
				}
			],
			feedback: MOCK_FEEDBACK,
			schedule: schedule.length ? schedule : demo.schedule,
			patients
		};
	} catch {
		return buildDemoDoctorDetail(doctorId);
	}
}

export function getPatientStatusConfig(status: DoctorPatientRow['status']) {
	const map = {
		in_treatment: { label: 'در حال درمان', class: 'bg-primary text-primary-foreground' },
		discharged: {
			label: 'ترخیص‌شده',
			class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
		},
		admitted: {
			label: 'پذیرش‌شده',
			class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
		}
	} as const;
	return map[status];
}
