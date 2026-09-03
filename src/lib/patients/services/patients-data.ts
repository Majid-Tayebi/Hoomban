import { pb } from '$lib/pocketbase';
import type { AuthUser } from '$lib/auth.svelte';
import type {
	PatientCareStatus,
	PatientFilters,
	PatientGender,
	PatientListItem,
	PatientsPageData
} from '../types';
import { formatPatientCodeFromUser } from '../patient-code';
import { escapeFilterValue } from '$lib/pocketbase-filter';

type PatientsUser = NonNullable<AuthUser>;

export type PatientsQuery = {
	page?: number;
	pageSize?: number;
	query?: string;
};

export type PatientsPageResult = PatientsPageData & {
	totalItems: number;
	page: number;
	pageSize: number;
};

function clientDisplayName(name: string): string {
	return name.replaceAll('بیمار', 'مراجع').trim() || 'مراجع';
}

function escapeFilter(value: string): string {
	return escapeFilterValue(value);
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
		const apts = await pb.collection('appointments').getList(1, 100, {
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
		/* optional enrichment */
	}
	return map;
}

function toPatientItem(
	u: { id: string; name?: string; mobile?: string; created?: string },
	i: number,
	doc?: { doctorName: string; specialty: string; date: Date | null }
): PatientListItem {
	const name = clientDisplayName(String(u.name || 'مراجع'));
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
}

async function fetchDoctorPatients(
	user: PatientsUser,
	query: string
): Promise<{ patients: PatientListItem[]; totalItems: number }> {
	const docList = await pb.collection('doctors').getList(1, 1, {
		filter: `user = "${escapeFilter(user.id)}"`
	});
	if (!docList.items.length) {
		return { patients: [], totalItems: 0 };
	}

	const doctorId = docList.items[0].id;
		const apts = await pb.collection('appointments').getList(1, 100, {
			filter: `doctor = "${escapeFilter(doctorId)}"`,
			expand: 'patient,doctor,doctor.user',
			sort: '-date_time'
		});

	const map = new Map<string, PatientListItem>();
	let i = 0;
	for (const a of apts.items) {
		const exp = a.expand as {
			patient?: { id: string; name?: string; mobile?: string; created?: string };
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

	let list = [...map.values()];
	const q = query.trim();
	if (q) {
		list = list.filter(
			(p) =>
				p.name.includes(q) ||
				p.mobile.includes(q) ||
				p.patientCode.includes(q) ||
				p.doctorName.includes(q)
		);
	}
	return { patients: list, totalItems: list.length };
}

async function fetchAdminPatients(
	page: number,
	pageSize: number,
	query: string
): Promise<{ patients: PatientListItem[]; totalItems: number }> {
	const q = query.trim();
	const filterParts = ['role = "patient"'];
	if (q) {
		const safe = escapeFilter(q);
		filterParts.push(`(name ~ "${safe}" || mobile ~ "${safe}")`);
	}

	const res = await pb.collection('users').getList(page, pageSize, {
		filter: filterParts.join(' && '),
		sort: '-created'
	});

	const doctorByPatient = await loadPatientDoctorMap();
	const offset = (page - 1) * pageSize;

	return {
		patients: res.items.map((u, i) =>
			toPatientItem(
				u as { id: string; name?: string; mobile?: string; created?: string },
				offset + i,
				doctorByPatient.get(u.id)
			)
		),
		totalItems: res.totalItems
	};
}

async function fetchPatients(
	user: PatientsUser,
	opts: PatientsQuery = {}
): Promise<{ patients: PatientListItem[]; totalItems: number; page: number; pageSize: number }> {
	const page = Math.max(1, opts.page ?? 1);
	const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 12));
	const query = opts.query ?? '';

	if (user.id === 'demo-user') {
		return { patients: [], totalItems: 0, page, pageSize };
	}

	try {
		if (user.role === 'doctor') {
			const result = await fetchDoctorPatients(user, query);
			const start = (page - 1) * pageSize;
			return {
				patients: result.patients.slice(start, start + pageSize),
				totalItems: result.totalItems,
				page,
				pageSize
			};
		}

		const result = await fetchAdminPatients(page, pageSize, query);
		return { ...result, page, pageSize };
	} catch (err) {
		console.error('fetchPatients failed:', err);
		return { patients: [], totalItems: 0, page, pageSize };
	}
}

export async function loadPatientsPageData(
	user: AuthUser,
	opts: PatientsQuery = {}
): Promise<PatientsPageResult> {
	if (!user) throw new Error('User is required');
	const result = await fetchPatients(user, opts);
	return {
		patients: result.patients,
		totalItems: result.totalItems,
		page: result.page,
		pageSize: result.pageSize
	};
}

/** Client-side filter for already-loaded rows (e.g. doctor page slice). Prefer server query. */
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
