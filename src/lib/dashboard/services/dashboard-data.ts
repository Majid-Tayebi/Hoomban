import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
import type { AuthUser } from '$lib/auth.svelte';
import { addDays, startOfDay, toPersianWeekdayIndex, WEEKDAYS_FA } from '$lib/date';
import { fetchPaymentsTotal } from '$lib/desk/services/accounting';
import type {
	DashboardAppointment,
	DashboardData,
	DashboardRoleView,
	DashboardStat,
	DoctorScheduleItem,
	QuickLink
} from '../types';
import { MOCK_APPOINTMENTS } from '../data/mock-data';
import { formatPatientCodeFromUser } from '$lib/patients/patient-code';
import { formatSlotsLabel, resolveDaySlots } from '$lib/schedule/working-schedule';

type DashboardUser = NonNullable<AuthUser>;

type WorkingDay = {
	day?: string;
	enabled?: boolean;
	startTime?: string | null;
	endTime?: string | null;
	slots?: { startTime: string; endTime: string }[];
};

function roleView(role: string | undefined): DashboardRoleView {
	if (role === 'admin' || role === 'secretary' || role === 'doctor' || role === 'patient' || role === 'writer') {
		return role;
	}
	return 'patient';
}

function mapAppointmentStatus(status: string): DashboardAppointment['status'] {
	switch (status) {
		case 'completed':
			return 'completed';
		case 'cancelled':
			return 'cancelled';
		case 'ongoing':
			return 'ongoing';
		case 'confirmed':
			return 'confirmed';
		case 'reserved':
			return 'reserved';
		case 'pending':
			return 'pending';
		default:
			return 'scheduled';
	}
}

type ExpandedAppointment = {
	patient?: { id?: string; name?: string; mobile?: string; created?: string };
	doctor?: {
		display_name?: string;
		specialty?: string;
		expand?: { user?: { name?: string } };
	};
};

function mapAppointmentRecords(
	items: { id: string; type?: unknown; date_time?: unknown; status?: unknown; expand?: unknown }[],
): DashboardAppointment[] {
	return items.map((apt, index) => {
		const exp = apt.expand as ExpandedAppointment;
		return {
			id: apt.id,
			patientName: exp.patient?.name || 'مراجع',
			patientUserId: exp.patient?.id || '',
			patientId: exp.patient?.id
				? formatPatientId(
						exp.patient.id,
						exp.patient.created ?? (apt.date_time ? String(apt.date_time) : null),
						index
					)
				: '—',
			phone: exp.patient?.mobile ? String(exp.patient.mobile) : '—',
			doctorName: exp.doctor?.display_name || exp.doctor?.expand?.user?.name || 'روانشناس',
			doctorId: String((apt as { doctor?: string }).doctor || ''),
			specialty: exp.doctor?.specialty || 'روانشناسی',
			type: apt.type === 'online' ? 'جلسه آنلاین' : 'ویزیت حضوری',
			dateTime: new Date(String(apt.date_time)),
			status: mapAppointmentStatus(String(apt.status))
		};
	});
}

function formatPatientId(id: string, created?: string | null, index?: number): string {
	return formatPatientCodeFromUser(id, created, index);
}

function firstName(name: string | undefined): string {
	return name?.split(/\s+/)[0] || 'کاربر';
}

function startOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function startOfNextMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

function doctorPhotoUrl(id: string, photo: string | undefined): string | null {
	if (!photo) return null;
	return pb.files.getURL({ id, collectionName: 'doctors' } as never, photo);
}

function initialsFromName(name: string): string {
	return name
		.split(/\s+/)
		.map((w) => w.charAt(0))
		.slice(0, 2)
		.join('.');
}

function todayWorkingSlot(workingDays: WorkingDay[]): string | undefined {
	const dayName = WEEKDAYS_FA[toPersianWeekdayIndex(new Date())];
	const today = workingDays.find((d) => d.day === dayName && d.enabled);
	if (!today) return undefined;
	const slots = resolveDaySlots(today);
	if (slots.length) return formatSlotsLabel(slots);
	return 'حضور امروز';
}

function isWorkingToday(workingDays: WorkingDay[]): boolean {
	const dayName = WEEKDAYS_FA[toPersianWeekdayIndex(new Date())];
	return workingDays.some((d) => d.day === dayName && d.enabled);
}

async function resolveDoctorId(userId: string): Promise<string | null> {
	try {
		const dr = await pb.collection('doctors').getList(1, 1, { filter: `user = "${userId}"` });
		return dr.items[0]?.id ?? null;
	} catch {
		return null;
	}
}

function inProgressAppointmentsFilter(from: Date, to: Date): string {
	return `date_time >= "${from.toISOString()}" && date_time < "${to.toISOString()}" && status != "cancelled" && status != "completed"`;
}

async function fetchAppointments(
	user: DashboardUser,
	doctorId: string | null,
	limit = 10
): Promise<DashboardAppointment[]> {
	if (user.id === 'demo-user') return MOCK_APPOINTMENTS;

	try {
		let filter = '';
		let sort = '-date_time';

		if (user.role === 'patient') {
			filter = `patient = "${user.id}"`;
		} else if (user.role === 'doctor' && doctorId) {
			filter = `doctor = "${doctorId}"`;
		} else if (user.role === 'doctor') {
			return [];
		} else if (user.role === 'secretary') {
			const dayStart = startOfDay(new Date());
			const weekEnd = addDays(dayStart, 7);
			filter = inProgressAppointmentsFilter(dayStart, weekEnd);
			sort = 'date_time';
		}

		const result = await pb.collection('appointments').getList(1, limit, {
			filter,
			sort,
			expand: 'patient,doctor',
			...PB_NO_AUTO_CANCEL
		});

		return mapAppointmentRecords(result.items);
	} catch (err) {
		console.error('fetchAppointments failed:', err);
		return [];
	}
}

async function countAppointments(filter: string): Promise<number> {
	try {
		const r = await pb.collection('appointments').getList(1, 1, { filter, ...PB_NO_AUTO_CANCEL });
		return r.totalItems;
	} catch {
		return 0;
	}
}

/** Sum paid_amount from transactions in the current calendar month. */
async function fetchMonthRevenue(): Promise<number> {
	const start = startOfMonth(new Date());
	const end = startOfNextMonth(new Date());
	return fetchPaymentsTotal({ from: start, to: end });
}

async function fetchTodayAppointmentCounts(): Promise<Map<string, number>> {
	const dayStart = startOfDay(new Date());
	const dayEnd = addDays(dayStart, 1);
	const counts = new Map<string, number>();

	try {
		const items = await pb.collection('appointments').getList(1, 200, {
			filter: `date_time >= "${dayStart.toISOString()}" && date_time < "${dayEnd.toISOString()}" && status != "cancelled"`,
			fields: 'id,doctor',
			...PB_NO_AUTO_CANCEL
		});

		for (const apt of items.items) {
			const doctorId = String(apt.doctor || '');
			if (!doctorId) continue;
			counts.set(doctorId, (counts.get(doctorId) ?? 0) + 1);
		}
	} catch {
		/* empty map */
	}

	return counts;
}

async function fetchDoctors(): Promise<DoctorScheduleItem[]> {
	try {
		const [result, todayCounts] = await Promise.all([
			pb.collection('doctors').getList(1, 50, {
				filter: 'is_active = true',
				expand: 'user',
				sort: 'sort_order'
			}),
			fetchTodayAppointmentCounts()
		]);

		const doctors = result.items.map((doc) => {
			const exp = doc.expand as { user?: { name?: string } } | undefined;
			const name = String(doc.display_name || exp?.user?.name || 'روانشناس');
			const workingDays = Array.isArray(doc.working_days)
				? (doc.working_days as WorkingDay[])
				: [];
			const appointmentCount = todayCounts.get(doc.id) ?? 0;
			const onCalendarToday = isWorkingToday(workingDays);
			const activeToday = onCalendarToday;
			const timeSlot = todayWorkingSlot(workingDays);

			return {
				id: doc.id,
				name,
				specialty: String(doc.specialty || 'روانشناسی'),
				initials: initialsFromName(name),
				photoUrl: doctorPhotoUrl(doc.id, doc.photo ? String(doc.photo) : undefined),
				activeToday,
				timeSlot: activeToday ? timeSlot : undefined,
				appointmentCount
			};
		});

		return doctors.sort((a, b) => {
			if (a.activeToday !== b.activeToday) return a.activeToday ? -1 : 1;
			if (b.appointmentCount !== a.appointmentCount) return b.appointmentCount - a.appointmentCount;
			return a.name.localeCompare(b.name, 'fa');
		});
	} catch {
		return [];
	}
}

async function secretaryStats(): Promise<DashboardStat[]> {
	const dayStart = startOfDay(new Date());
	const dayEnd = addDays(dayStart, 1);
	const weekStart = addDays(dayStart, -6);

	const [patients, todayApts, weekApts, monthRevenue] = await Promise.all([
		pb.collection('users').getList(1, 1, { filter: 'role = "patient"' }).catch(() => ({ totalItems: 0 })),
		countAppointments(
			`date_time >= "${dayStart.toISOString()}" && date_time < "${dayEnd.toISOString()}" && status != "cancelled"`
		),
		countAppointments(
			`date_time >= "${weekStart.toISOString()}" && date_time < "${dayEnd.toISOString()}" && status != "cancelled"`
		),
		fetchMonthRevenue()
	]);

	return [
		{
			id: 'patients',
			label: 'مراجعان',
			value: patients.totalItems,
			subtext: 'ثبت‌شده در کلینیک',
			icon: 'patients'
		},
		{
			id: 'today',
			label: 'نوبت امروز',
			value: todayApts,
			subtext: 'غیرلغو‌شده',
			icon: 'today'
		},
		{
			id: 'week',
			label: 'نوبت این هفته',
			value: weekApts,
			subtext: '۷ روز اخیر تا امروز',
			icon: 'appointments'
		},
		{
			id: 'revenue',
			label: 'درآمد ماه جاری',
			value: monthRevenue,
			subtext: 'تومان — از پرداخت‌های ثبت‌شده',
			icon: 'revenue'
		}
	];
}

async function adminClinicStats(): Promise<DashboardStat[]> {
	const monthStart = startOfMonth(new Date());
	const monthEnd = startOfNextMonth(new Date());
	const monthStartIso = monthStart.toISOString();
	const monthEndIso = monthEnd.toISOString();

	const [doctors, patients, newPatients, monthRevenue, monthApts] = await Promise.all([
		pb.collection('doctors').getList(1, 1, { filter: 'is_active = true' }).catch(() => ({ totalItems: 0 })),
		pb.collection('users').getList(1, 1, { filter: 'role = "patient"' }).catch(() => ({ totalItems: 0 })),
		pb
			.collection('users')
			.getList(1, 1, {
				filter: `role = "patient" && created >= "${monthStartIso}" && created < "${monthEndIso}"`
			})
			.catch(() => ({ totalItems: 0 })),
		fetchMonthRevenue(),
		countAppointments(
			`date_time >= "${monthStartIso}" && date_time < "${monthEndIso}" && status != "cancelled"`
		)
	]);

	const newCount = newPatients.totalItems;
	const patientSubtext =
		newCount > 0
			? `${newCount.toLocaleString('fa-IR')} ثبت‌شده این ماه · ${monthApts.toLocaleString('fa-IR')} نوبت`
			: `${monthApts.toLocaleString('fa-IR')} نوبت این ماه`;

	return [
		{
			id: 'doctors',
			label: 'متخصصین',
			value: doctors.totalItems,
			subtext: 'فعال در کلینیک',
			icon: 'doctors'
		},
		{
			id: 'patients',
			label: 'مراجعان',
			value: patients.totalItems,
			subtext: patientSubtext,
			icon: 'patients'
		},
		{
			id: 'revenue',
			label: 'درآمد ماه جاری',
			value: monthRevenue,
			subtext: 'تومان — از پرداخت‌های ثبت‌شده',
			icon: 'revenue'
		}
	];
}

export interface ClinicOverviewStats {
	appointments: number;
	patients: number;
	doctors: number;
	staff: number;
	monthRevenue: number;
}

/** Shared counts for admin hub and management pages. */
export async function fetchClinicOverviewStats(): Promise<ClinicOverviewStats> {
	const [appointments, patients, doctors, staff, monthRevenue] = await Promise.all([
		pb.collection('appointments').getList(1, 1).catch(() => ({ totalItems: 0 })),
		pb.collection('users').getList(1, 1, { filter: 'role = "patient"' }).catch(() => ({ totalItems: 0 })),
		pb.collection('doctors').getList(1, 1, { filter: 'is_active = true' }).catch(() => ({ totalItems: 0 })),
		pb.collection('staff_registry').getList(1, 1).catch(() => ({ totalItems: 0 })),
		fetchMonthRevenue()
	]);

	return {
		appointments: appointments.totalItems,
		patients: patients.totalItems,
		doctors: doctors.totalItems,
		staff: staff.totalItems,
		monthRevenue
	};
}

async function doctorStats(doctorId: string | null): Promise<DashboardStat[]> {
	if (!doctorId) {
		return [
			{ id: 'today', label: 'نوبت امروز من', value: 0, icon: 'today', subtext: 'پروفایل متخصص یافت نشد' },
			{ id: 'upcoming', label: 'نوبت‌های پیش‌رو', value: 0, icon: 'upcoming' },
			{ id: 'completed', label: 'تکمیل‌شده', value: 0, icon: 'completed' }
		];
	}

	const dayStart = startOfDay(new Date());
	const dayEnd = addDays(dayStart, 1);
	const nowIso = new Date().toISOString();

	const [today, upcoming, completed] = await Promise.all([
		countAppointments(
			`doctor = "${doctorId}" && date_time >= "${dayStart.toISOString()}" && date_time < "${dayEnd.toISOString()}" && status != "cancelled"`
		),
		countAppointments(
			`doctor = "${doctorId}" && date_time >= "${nowIso}" && status != "cancelled" && status != "completed"`
		),
		countAppointments(`doctor = "${doctorId}" && status = "completed"`)
	]);

	return [
		{ id: 'today', label: 'نوبت امروز من', value: today, subtext: 'برنامه امروز', icon: 'today' },
		{ id: 'upcoming', label: 'نوبت‌های پیش‌رو', value: upcoming, subtext: 'رزرو / تأیید', icon: 'upcoming' },
		{ id: 'completed', label: 'جلسات تکمیل‌شده', value: completed, subtext: 'کل پرونده‌ها', icon: 'completed' }
	];
}

async function patientStats(userId: string): Promise<DashboardStat[]> {
	const nowIso = new Date().toISOString();
	const [upcoming, completed, total] = await Promise.all([
		countAppointments(
			`patient = "${userId}" && date_time >= "${nowIso}" && status != "cancelled" && status != "completed"`
		),
		countAppointments(`patient = "${userId}" && status = "completed"`),
		countAppointments(`patient = "${userId}"`)
	]);

	return [
		{ id: 'upcoming', label: 'نوبت‌های آینده', value: upcoming, subtext: 'رزرو‌شده برای شما', icon: 'upcoming' },
		{ id: 'completed', label: 'جلسات گذشته', value: completed, subtext: 'تکمیل‌شده', icon: 'completed' },
		{ id: 'total', label: 'کل نوبت‌ها', value: total, subtext: 'تاریخچه شما', icon: 'appointments' }
	];
}

async function writerStats(): Promise<DashboardStat[]> {
	try {
		const articles = await pb.collection('articles').getList(1, 1);
		return [
			{
				id: 'articles',
				label: 'مقالات',
				value: articles.totalItems,
				subtext: 'محتوای منتشر / پیش‌نویس',
				icon: 'articles'
			}
		];
	} catch {
		return [{ id: 'articles', label: 'مقالات', value: 0, icon: 'articles' }];
	}
}

function quickLinksFor(role: DashboardRoleView): QuickLink[] {
	if (role === 'admin') {
		return [
			{ id: 'a1', label: 'نوبت‌ها', href: '/dashboard/appointments', description: 'مدیریت نوبت کلینیک', icon: 'calendar' },
			{ id: 'a2', label: 'مراجعان', href: '/dashboard/patients', description: 'پرونده‌ها', icon: 'patients' },
			{ id: 'a3', label: 'پزشکان', href: '/dashboard/doctors', description: 'تیم درمان', icon: 'doctors' },
			{ id: 'a4', label: 'تقویم', href: '/dashboard/calendar', description: 'برنامه کلینیک', icon: 'calendar' }
		];
	}
	if (role === 'secretary') {
		return [
			{ id: 's1', label: 'نوبت‌ها', href: '/dashboard/appointments', description: 'لیست و پیگیری', icon: 'calendar' },
			{ id: 's2', label: 'تقویم', href: '/dashboard/calendar', description: 'زمان‌بندی', icon: 'calendar' },
			{ id: 's3', label: 'متخصصین', href: '/dashboard/doctors', description: 'ارجاع مراجع', icon: 'doctors' },
			{ id: 's4', label: 'رزرو نوبت', href: '/appointments/book', description: 'نوبت جدید', icon: 'book' }
		];
	}
	if (role === 'doctor') {
		return [
			{ id: 'd1', label: 'نوبت‌های من', href: '/dashboard/appointments', description: 'جلسات امروز و آینده', icon: 'calendar' },
			{ id: 'd2', label: 'مراجعان من', href: '/dashboard/patients', description: 'پرونده بالینی', icon: 'patients' },
			{ id: 'd3', label: 'ساعات کاری', href: '/dashboard/schedule', description: 'تنظیم شیفت', icon: 'schedule' }
		];
	}
	if (role === 'patient') {
		return [
			{ id: 'p1', label: 'نوبت‌های من', href: '/dashboard/appointments', description: 'مشاهده و ویرایش نوبت', icon: 'calendar' },
			{ id: 'p2', label: 'رزرو نوبت', href: '/appointments/book', description: 'درخواست جلسه جدید', icon: 'book' },
			{ id: 'p3', label: 'تست‌ها', href: '/tests', description: 'آزمون‌های روانشناسی', icon: 'tests' }
		];
	}
	return [
		{ id: 'w1', label: 'مقالات', href: '/dashboard/articles', description: 'ویرایش محتوا', icon: 'articles' },
		{ id: 'w2', label: 'تست‌ها', href: '/dashboard/tests', description: 'مدیریت آزمون', icon: 'tests' }
	];
}

function copyFor(role: DashboardRoleView, name: string): { greeting: string; subtitle: string; appointmentsTitle: string } {
	const n = firstName(name);
	if (role === 'admin') {
		return {
			greeting: `سلام ${n}، نمای مدیریت کلینیک`,
			subtitle: 'متخصصین، مراجعان و درآمد ماه — مستقیم از پایگاه داده',
			appointmentsTitle: 'آخرین نوبت‌های کلینیک'
		};
	}
	if (role === 'secretary') {
		return {
			greeting: `سلام ${n}، میز منشی`,
			subtitle: 'نوبت‌دهی، هماهنگی متخصصین و تقویم امروز',
			appointmentsTitle: 'نوبت‌های در جریان'
		};
	}
	if (role === 'doctor') {
		return {
			greeting: `سلام ${n}، داشبورد روانشناس`,
			subtitle: 'جلسات شما، مراجعان و ساعات کاری',
			appointmentsTitle: 'نوبت‌های من'
		};
	}
	if (role === 'patient') {
		return {
			greeting: `سلام ${n}، خوش آمدید`,
			subtitle: 'نوبت‌ها و خدمات شخصی شما',
			appointmentsTitle: 'نوبت‌های من'
		};
	}
	return {
		greeting: `سلام ${n}`,
		subtitle: 'مدیریت محتوا و تست‌های کلینیک',
		appointmentsTitle: 'فعالیت اخیر'
	};
}

export async function loadDashboardData(user: AuthUser): Promise<DashboardData> {
	if (!user) throw new Error('User is required to load dashboard data');

	const role = roleView(user.role);
	const copy = copyFor(role, user.name ?? '');
	const doctorId = role === 'doctor' ? await resolveDoctorId(user.id) : null;

	const [stats, appointments, doctors] = await Promise.all([
		role === 'admin'
			? adminClinicStats().catch(() => [
					{ id: 'doctors', label: 'متخصصین', value: 0, icon: 'doctors' as const, subtext: 'فعال در کلینیک' },
					{ id: 'patients', label: 'مراجعان', value: 0, icon: 'patients' as const, subtext: 'ثبت‌شده در کلینیک' },
					{
						id: 'revenue',
						label: 'درآمد ماه جاری',
						value: 0,
						icon: 'revenue' as const,
						subtext: 'تومان — از پرداخت‌های ثبت‌شده'
					}
				])
			: role === 'secretary'
				? secretaryStats().catch(() => [
						{ id: 'patients', label: 'مراجعان', value: 0, icon: 'patients' as const },
						{ id: 'today', label: 'نوبت امروز', value: 0, icon: 'today' as const },
						{ id: 'week', label: 'نوبت این هفته', value: 0, icon: 'appointments' as const },
						{ id: 'revenue', label: 'درآمد ماه جاری', value: 0, icon: 'revenue' as const, subtext: 'تومان' }
					])
				: role === 'doctor'
				? doctorStats(doctorId)
				: role === 'patient'
					? patientStats(user.id)
					: writerStats(),
		role === 'writer' ? Promise.resolve([]) : fetchAppointments(user, doctorId),
		role === 'admin' || role === 'secretary' ? fetchDoctors() : Promise.resolve([])
	]);

	return {
		role,
		greeting: copy.greeting,
		subtitle: copy.subtitle,
		stats,
		appointments,
		appointmentsTitle: copy.appointmentsTitle,
		doctors,
		quickLinks: quickLinksFor(role),
		showDoctorsPanel: role === 'admin' || role === 'secretary'
	};
}

export function getDoctorSummary(doctors: DoctorScheduleItem[]) {
	const total = doctors.length;
	const activeToday = doctors.filter((d) => d.activeToday).length;
	return { total, activeToday, inactiveToday: total - activeToday };
}
