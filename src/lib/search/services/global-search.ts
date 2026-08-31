import { pb } from '$lib/pocketbase';
import type { UserRole } from '$lib/auth.svelte';
import { canAccessPatientRecord, canAccessSecretaryPatientDesk, getPatientRecordHref } from '$lib/rbac';
import { MOCK_DOCTORS } from '$lib/doctors/data/mock-data';
import { MOCK_PATIENTS } from '$lib/patients/data/mock-data';
import { MOCK_APPOINTMENT_LIST } from '$lib/appointments/data/mock-data';
import { formatFaDateTime } from '$lib/date';
import { formatPatientCodeFromUser } from '$lib/patients/patient-code';

export type GlobalSearchCategory = 'مراجع' | 'متخصص' | 'نوبت' | 'همکار' | 'صفحه';

export type GlobalSearchResult = {
	id: string;
	category: GlobalSearchCategory;
	title: string;
	subtitle?: string;
	href: string;
};

type NavShortcut = {
	id: string;
	title: string;
	subtitle: string;
	href: string;
	keywords: string[];
	roles: UserRole[];
};

const NAV_SHORTCUTS: NavShortcut[] = [
	{
		id: 'nav-appointments',
		title: 'نوبت‌ها',
		subtitle: 'فهرست و مدیریت نوبت',
		href: '/dashboard/appointments',
		keywords: ['نوبت', 'appointment'],
		roles: ['admin', 'secretary', 'doctor']
	},
	{
		id: 'nav-accounting',
		title: 'حسابداری',
		subtitle: 'پیگیری پرداخت مراجعان',
		href: '/dashboard/desk/accounting',
		keywords: ['حسابداری', 'پرداخت', 'accounting'],
		roles: ['admin', 'secretary']
	},
	{
		id: 'nav-calendar',
		title: 'تقویم',
		subtitle: 'برنامه کلینیک',
		href: '/dashboard/calendar',
		keywords: ['تقویم', 'calendar'],
		roles: ['admin', 'secretary']
	},
	{
		id: 'nav-doctors',
		title: 'متخصصین',
		subtitle: 'فهرست پزشکان',
		href: '/dashboard/doctors',
		keywords: ['پزشک', 'متخصص', 'doctor'],
		roles: ['admin', 'secretary']
	},
	{
		id: 'nav-patients',
		title: 'مراجعان',
		subtitle: 'پرونده مراجعان',
		href: '/dashboard/patients',
		keywords: ['مراجع', 'بیمار', 'patient'],
		roles: ['admin', 'doctor']
	},
	{
		id: 'nav-book',
		title: 'رزرو نوبت',
		subtitle: 'ثبت نوبت جدید',
		href: '/appointments/book',
		keywords: ['رزرو', 'book'],
		roles: ['admin', 'secretary']
	},
	{
		id: 'nav-staff',
		title: 'همکاران',
		subtitle: 'مدیریت پرسنل',
		href: '/dashboard/admin/staff',
		keywords: ['همکار', 'پرسنل', 'staff'],
		roles: ['admin']
	},
	{
		id: 'nav-services',
		title: 'خدمات',
		subtitle: 'خدمات کلینیک',
		href: '/dashboard/services',
		keywords: ['خدمت', 'service'],
		roles: ['admin', 'secretary']
	},
	{
		id: 'nav-articles',
		title: 'مقالات',
		subtitle: 'محتوای وبلاگ',
		href: '/dashboard/articles',
		keywords: ['مقاله', 'article'],
		roles: ['admin', 'writer']
	},
	{
		id: 'nav-tests',
		title: 'آزمون‌ها',
		subtitle: 'مدیریت آزمون‌های روانشناسی',
		href: '/dashboard/tests',
		keywords: ['تست', 'test', 'آزمون'],
		roles: ['admin', 'secretary', 'writer']
	},
	{
		id: 'nav-profile',
		title: 'پروفایل',
		subtitle: 'اطلاعات شخصی، آواتار و رمز عبور',
		href: '/dashboard/profile',
		keywords: ['پروفایل', 'profile', 'حساب', 'رمز', 'آواتار', 'عکس'],
		roles: ['admin', 'secretary', 'doctor', 'writer', 'patient']
	},
	{
		id: 'nav-settings',
		title: 'تنظیمات کلینیک',
		subtitle: 'پیامک و پیکربندی (فقط مدیر)',
		href: '/dashboard/settings',
		keywords: ['تنظیمات', 'settings', 'پیامک', 'sms'],
		roles: ['admin']
	}
];

function matchesQuery(text: string, q: string): boolean {
	return text.toLowerCase().includes(q.toLowerCase());
}

function searchNavShortcuts(role: string | undefined, q: string): GlobalSearchResult[] {
	if (!role) return [];
	return NAV_SHORTCUTS.filter(
		(item) => item.roles.includes(role as UserRole) && item.keywords.some((k) => matchesQuery(k, q))
	).map((item) => ({
		id: item.id,
		category: 'صفحه',
		title: item.title,
		subtitle: item.subtitle,
		href: item.href
	}));
}

async function searchDoctors(q: string, isDemo: boolean, role?: string): Promise<GlobalSearchResult[]> {
	const hrefFor = (id: string) =>
		role === 'secretary' ? '/dashboard/doctors' : `/dashboard/doctors/${id}`;

	if (isDemo) {
		return MOCK_DOCTORS.filter(
			(d) => matchesQuery(d.displayName, q) || matchesQuery(d.specialty, q)
		).map((d) => ({
			id: `doctor-${d.id}`,
			category: 'متخصص' as const,
			title: d.displayName,
			subtitle: d.specialty,
			href: hrefFor(d.id)
		}));
	}

	try {
		const filter = `(display_name ~ "${q}" || specialty ~ "${q}") && is_active = true`;
		const res = await pb.collection('doctors').getList(1, 8, {
			filter,
			expand: 'user'
		});
		return res.items.map((d) => {
			const exp = d.expand as { user?: { name?: string } } | undefined;
			const name = String(d.display_name || exp?.user?.name || 'متخصص');
			return {
				id: `doctor-${d.id}`,
				category: 'متخصص' as const,
				title: name,
				subtitle: String(d.specialty || ''),
				href: hrefFor(String(d.id))
			};
		});
	} catch {
		return [];
	}
}

async function searchPatients(
	q: string,
	isDemo: boolean,
	role?: string
): Promise<GlobalSearchResult[]> {
	const hrefFor = (id: string) => getPatientRecordHref(id, role);

	if (isDemo) {
		return MOCK_PATIENTS.filter(
			(p) =>
				matchesQuery(p.name, q) ||
				matchesQuery(p.id, q) ||
				matchesQuery(p.mobile, q) ||
				matchesQuery(p.patientCode, q)
		)
			.slice(0, 8)
			.map((p) => ({
				id: `patient-${p.id}`,
				category: 'مراجع' as const,
				title: p.name,
				subtitle: p.patientCode,
				href: hrefFor(p.id)
			}));
	}

	try {
		const filter = `(name ~ "${q}" || mobile ~ "${q}") && role = "patient"`;
		const res = await pb.collection('users').getList(1, 8, { filter });
		return res.items.map((u) => ({
			id: `patient-${u.id}`,
			category: 'مراجع' as const,
			title: String(u.name || 'مراجع').replaceAll('بیمار', 'مراجع'),
			subtitle: u.mobile
				? String(u.mobile)
				: formatPatientCodeFromUser(u.id, u.created ? String(u.created) : null),
			href: hrefFor(String(u.id))
		}));
	} catch {
		return [];
	}
}

async function searchStaff(q: string, isDemo: boolean): Promise<GlobalSearchResult[]> {
	if (isDemo) return [];

	try {
		const filter = `(name ~ "${q}" || mobile ~ "${q}" || email ~ "${q}") && role != "patient"`;
		const res = await pb.collection('users').getList(1, 6, { filter });
		return res.items.map((u) => ({
			id: `staff-${u.id}`,
			category: 'همکار' as const,
			title: String(u.name || 'کاربر'),
			subtitle: String(u.role || ''),
			href: '/dashboard/admin/staff'
		}));
	} catch {
		return [];
	}
}

async function searchAppointments(
	q: string,
	role: string | undefined,
	userId: string,
	isDemo: boolean
): Promise<GlobalSearchResult[]> {
	if (isDemo) {
		return MOCK_APPOINTMENT_LIST.filter(
			(a) =>
				matchesQuery(a.patientName, q) ||
				matchesQuery(a.doctorName, q) ||
				matchesQuery(a.patientId, q) ||
				matchesQuery(a.phone, q)
		)
			.slice(0, 8)
			.map((a) => ({
				id: `apt-${a.id}`,
				category: 'نوبت' as const,
				title: a.patientName,
				subtitle: `${a.doctorName} · ${formatFaDateTime(a.dateTime)}`,
				href: '/dashboard/appointments'
			}));
	}

	try {
		let filter = `(patient.name ~ "${q}" || doctor.display_name ~ "${q}")`;
		if (role === 'doctor') {
			const docList = await pb.collection('doctors').getList(1, 1, {
				filter: `user = "${userId}"`
			});
			if (docList.items.length) {
				filter = `doctor = "${docList.items[0].id}" && (${filter})`;
			}
		}

		const res = await pb.collection('appointments').getList(1, 8, {
			filter,
			expand: 'patient,doctor,doctor.user',
			sort: '-date_time'
		});

		return res.items.map((a) => {
			const exp = a.expand as {
				patient?: { name?: string };
				doctor?: { display_name?: string; expand?: { user?: { name?: string } } };
			};
			const patientName = String(exp?.patient?.name || 'مراجع');
			const doctorName = String(
				exp?.doctor?.display_name || exp?.doctor?.expand?.user?.name || 'متخصص'
			);
			const when = a.date_time ? formatFaDateTime(new Date(String(a.date_time))) : '';
			return {
				id: `apt-${a.id}`,
				category: 'نوبت' as const,
				title: patientName,
				subtitle: `${doctorName}${when ? ` · ${when}` : ''}`,
				href: '/dashboard/appointments'
			};
		});
	} catch {
		return [];
	}
}

export async function runGlobalSearch(
	query: string,
	role: string | undefined,
	userId: string
): Promise<GlobalSearchResult[]> {
	const q = query.trim();
	if (q.length < 2) return [];

	const isDemo = userId === 'demo-user';
	const tasks: Promise<GlobalSearchResult[]>[] = [Promise.resolve(searchNavShortcuts(role, q))];

	const canDoctors = role === 'admin' || role === 'secretary';
	const canAppointments = role === 'admin' || role === 'secretary' || role === 'doctor';
	const canPatients = canAccessPatientRecord(role) || canAccessSecretaryPatientDesk(role);
	const canStaff = role === 'admin';

	if (canDoctors) tasks.push(searchDoctors(q, isDemo, role));
	if (canPatients) tasks.push(searchPatients(q, isDemo, role));
	if (canAppointments) tasks.push(searchAppointments(q, role, userId, isDemo));
	if (canStaff) tasks.push(searchStaff(q, isDemo));

	const groups = await Promise.all(tasks);
	const merged = groups.flat();
	const seen = new Set<string>();

	return merged.filter((item) => {
		const key = `${item.category}:${item.href}:${item.title}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
