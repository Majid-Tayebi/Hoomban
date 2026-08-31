import { pb } from '$lib/pocketbase';
import type { AuthUser } from '$lib/auth.svelte';
import type {
	PatientCareStatus,
	PatientFilters,
	PatientGender,
	PatientListItem,
	PatientsPageData
} from '../types';
import { MOCK_PATIENTS } from '../data/mock-data';
import { formatPatientCodeFromUser } from '../patient-code';

type PatientsUser = NonNullable<AuthUser>;

function clientDisplayName(name: string): string {
	return name.replaceAll('بیمار', 'مراجع').trim() || 'مراجع';
}

function inferGender(name: string): PatientGender {
	const femaleHints = ['سارا', 'فاطمه', 'مریم', 'زهرا', 'نرگس', 'مینا', 'الهام', 'نازنین'];
	if (femaleHints.some((h) => name.includes(h))) return 'female';
	return 'unknown';
}

function mapStatus(index: number): PatientCareStatus {
	const statuses: PatientCareStatus[] = ['in_treatment', 'admitted', 'discharged'];
	return statuses[index % statuses.length];
}

async function loadPatientDoctorMap(): Promise<
	Map<string, { doctorName: string; specialty: string; date: Date | null }>
> {
	const map = new Map<string, { doctorName: string; specialty: string; date: Date | null }>();
	try {
		const apts = await pb.collection('appointments').getList(1, 500, {
			expand: 'patient,doctor,doctor.user',
			sort: '-date_time'
		});

		for (const a of apts.items) {
			const exp = a.expand as {
				patient?: { id: string };
				doctor?: { display_name?: string; specialty?: string; expand?: { user?: { name?: string } } };
			};
			const patientId = exp.patient?.id;
			if (!patientId || map.has(patientId)) continue;

			const notesPublic = a.notes_public ? String(a.notes_public) : '';
			const aptType = String(a.type || '');
			if (aptType === 'service' || notesPublic.includes('"service"')) continue;

			map.set(patientId, {
				doctorName:
					exp.doctor?.display_name || exp.doctor?.expand?.user?.name || '—',
				specialty: exp.doctor?.specialty || 'روانشناسی',
				date: a.date_time ? new Date(String(a.date_time)) : null
			});
		}
	} catch {
		/* optional */
	}
	return map;
}

async function fetchPatients(user: PatientsUser): Promise<PatientListItem[]> {
	if (user.id === 'demo-user') return MOCK_PATIENTS;

	try {
		if (user.role === 'doctor') {
			const docList = await pb.collection('doctors').getList(1, 1, {
				filter: `user = "${user.id}"`
			});
			if (!docList.items.length) return MOCK_PATIENTS;

			const doctorId = docList.items[0].id;
			const apts = await pb.collection('appointments').getList(1, 200, {
				filter: `doctor = "${doctorId}"`,
				expand: 'patient,doctor,doctor.user',
				sort: '-date_time'
			});

			const map = new Map<string, PatientListItem>();
			let i = 0;
			for (const a of apts.items) {
				const exp = a.expand as {
					patient?: { id: string; name?: string; mobile?: string };
					doctor?: { display_name?: string; specialty?: string; expand?: { user?: { name?: string } } };
				};
				const p = exp.patient;
				if (!p || map.has(p.id)) continue;
				const name = clientDisplayName(String(p.name || 'مراجع'));
				map.set(p.id, {
					id: p.id,
					name,
					patientCode: formatPatientCodeFromUser(p.id, a.date_time ? String(a.date_time) : null, i),
					mobile: String(p.mobile || '—'),
					gender: inferGender(name),
					condition: 'مشاوره',
					doctorName: exp.doctor?.display_name || exp.doctor?.expand?.user?.name || 'روانشناس',
					specialty: exp.doctor?.specialty || 'روانشناسی',
					admissionDate: a.date_time ? new Date(String(a.date_time)) : null,
					status: mapStatus(i)
				});
				i += 1;
			}

			const list = [...map.values()];
			return list.length ? list : MOCK_PATIENTS;
		}

		const res = await pb.collection('users').getList(1, 500, {
			filter: 'role = "patient"',
			sort: '-created'
		});

		if (!res.items.length) return MOCK_PATIENTS;

		const doctorByPatient = await loadPatientDoctorMap();

		return res.items.map((u, i) => {
			const name = clientDisplayName(String(u.name || 'مراجع'));
			const doc = doctorByPatient.get(u.id);
			return {
				id: u.id,
				name,
				patientCode: formatPatientCodeFromUser(u.id, u.created ? String(u.created) : null, i),
				mobile: String(u.mobile || '—'),
				gender: inferGender(name),
				condition: '—',
				doctorName: doc?.doctorName || '—',
				specialty: doc?.specialty || '—',
				admissionDate: doc?.date || (u.created ? new Date(String(u.created)) : null),
				status: 'in_treatment' as PatientCareStatus
			};
		});
	} catch {
		return MOCK_PATIENTS;
	}
}

export async function loadPatientsPageData(user: AuthUser): Promise<PatientsPageData> {
	if (!user) throw new Error('User is required');
	const patients = await fetchPatients(user);
	return { patients };
}

export function filterPatients(patients: PatientListItem[], filters: PatientFilters): PatientListItem[] {
	return patients.filter((p) => {
		const q = filters.query.trim();
		if (q) {
			const hit =
				p.name.includes(q) ||
				p.mobile.includes(q) ||
				p.patientCode.includes(q) ||
				p.doctorName.includes(q) ||
				p.specialty.includes(q);
			if (!hit) return false;
		}

		return true;
	});
}

export function getGenderLabel(gender: PatientGender): string {
	if (gender === 'male') return '♂';
	if (gender === 'female') return '♀';
	return '—';
}

export function getStatusConfig(status: PatientCareStatus) {
	const map = {
		admitted: {
			label: 'پذیرش‌شده',
			class: 'bg-cerulean-300/40 text-cerulean-800 dark:bg-cerulean-800 dark:text-cerulean-300'
		},
		in_treatment: {
			label: 'در حال درمان',
			class: 'bg-primary/15 text-primary'
		},
		discharged: {
			label: 'ترخیص‌شده',
			class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
		}
	} as const;
	return map[status];
}

export function formatAdmissionDate(d: Date | null): string {
	if (!d) return '—';
	return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}
