import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
import type { AuthUser } from '$lib/auth.svelte';
import { addDays, startOfDay, toPersianWeekdayIndex, WEEKDAYS_FA } from '$lib/date';
import type {
	AppointmentListItem,
	AppointmentListStatus,
	AppointmentStat,
	AppointmentTypeKey,
	AppointmentTypeSlice,
	AppointmentsPageData
} from '../types';
import { formatPatientCodeFromUser } from '$lib/patients/patient-code';

type AppointmentsUser = NonNullable<AuthUser>;

function mapStatus(status: string): AppointmentListStatus {
	switch (status) {
		case 'completed':
			return 'completed';
		case 'cancelled':
			return 'cancelled';
		case 'confirmed':
		case 'reserved':
			return 'scheduled';
		case 'pending':
			return 'pending';
		default:
			return 'scheduled';
	}
}

function mapType(type: string): { label: string; key: AppointmentTypeKey } {
	if (type === 'online') return { label: 'آنلاین', key: 'online' };
	return { label: 'ویزیت حضوری', key: 'consultation' };
}

function isToday(d: Date): boolean {
	const now = new Date();
	return (
		d.getFullYear() === now.getFullYear() &&
		d.getMonth() === now.getMonth() &&
		d.getDate() === now.getDate()
	);
}

function buildStatsFromList(list: AppointmentListItem[]): AppointmentStat[] {
	const today = list.filter((a) => isToday(a.dateTime)).length;
	const completed = list.filter((a) => a.status === 'completed').length;
	const ongoing = list.filter(
		(a) => a.status === 'ongoing' || a.status === 'confirmed' || a.status === 'scheduled'
	).length;
	const cancelled = list.filter((a) => a.status === 'cancelled').length;
	const incomplete = list.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length;

	return [
		{
			id: 'today',
			label: 'نوبت‌های امروز',
			value: today,
			subtext: 'غیرلغو‌شده در لیست',
			icon: 'today'
		},
		{
			id: 'completed',
			label: 'تکمیل‌شده',
			value: completed,
			subtext: `نوبت‌های ناقص ${incomplete.toLocaleString('fa-IR')}`,
			icon: 'completed'
		},
		{
			id: 'ongoing',
			label: 'در حال انجام',
			value: ongoing,
			subtext: 'زمان‌بندی / تأیید / در جریان',
			icon: 'ongoing'
		},
		{
			id: 'cancelled',
			label: 'لغو‌شده',
			value: cancelled,
			subtext: 'در بازه نمایش‌داده‌شده',
			icon: 'cancelled'
		}
	];
}

const TYPE_COLORS: Record<AppointmentTypeKey, string> = {
	consultation: '#1e7cae',
	follow_up: '#51afe1',
	assessment: '#7cc3e9',
	online: '#0f3e57'
};

const TYPE_LABELS: Record<AppointmentTypeKey, string> = {
	consultation: 'مشاوره',
	follow_up: 'پیگیری',
	assessment: 'ارزیابی',
	online: 'آنلاین'
};

function buildTypeDistribution(list: AppointmentListItem[]): AppointmentTypeSlice[] {
	const counts = new Map<AppointmentTypeKey, number>();
	for (const item of list) {
		counts.set(item.typeKey, (counts.get(item.typeKey) ?? 0) + 1);
	}

	const total = list.length;
	if (!total) return [];

	return (Object.keys(TYPE_LABELS) as AppointmentTypeKey[])
		.map((key) => {
			const count = counts.get(key) ?? 0;
			return {
				key,
				label: TYPE_LABELS[key],
				count,
				percent: Math.round((count / total) * 100),
				color: TYPE_COLORS[key]
			};
		})
		.filter((slice) => slice.count > 0);
}

export function buildTrendsChartData(list: AppointmentListItem[]) {
	const weekStart = addDays(startOfDay(new Date()), -6);
	const labels: string[] = [];
	const data: number[] = [];

	for (let i = 0; i < 7; i++) {
		const day = addDays(weekStart, i);
		labels.push(WEEKDAYS_FA[toPersianWeekdayIndex(day)].slice(0, 3));
		data.push(0);
	}

	for (const item of list) {
		const day = startOfDay(item.dateTime);
		const index = Math.floor((day.getTime() - weekStart.getTime()) / 86_400_000);
		if (index >= 0 && index < 7) data[index]++;
	}

	return {
		labels,
		datasets: [
			{
				label: 'نوبت',
				data,
				backgroundColor: '#1e7cae',
				borderRadius: 6
			}
		]
	};
}

async function fetchAppointments(user: AppointmentsUser): Promise<AppointmentListItem[]> {
	if (user.id === 'demo-user') return [];

	try {
		let filter = '';
		if (user.role === 'doctor') {
			const dr = await pb.collection('doctors').getList(1, 1, {
				filter: `user = "${user.id}"`,
				...PB_NO_AUTO_CANCEL
			});
			if (dr.items.length) filter = `doctor = "${dr.items[0].id}"`;
		} else if (user.role === 'patient') {
			filter = `patient = "${user.id}"`;
		}

		const limit = user.role === 'patient' || user.role === 'doctor' ? 50 : 100;

		const result = await pb.collection('appointments').getList(1, limit, {
			filter,
			sort: '-date_time',
			expand: 'patient,doctor',
			...PB_NO_AUTO_CANCEL
		});

		if (!result.items.length) return [];

		return result.items.map((apt, index) => {
			const exp = apt.expand as {
				patient?: { id?: string; name?: string; mobile?: string; created?: string };
				doctor?: { display_name?: string; specialty?: string; expand?: { user?: { name?: string } } };
			};
			const typeInfo = mapType(String(apt.type || 'in_person'));
			const patientId = exp.patient?.id
				? formatPatientCodeFromUser(
						exp.patient.id,
						exp.patient.created ?? (apt.date_time ? String(apt.date_time) : null),
						index
					)
				: 'P000026';

			return {
				id: apt.id,
				patientName: exp.patient?.name || 'بیمار',
				patientUserId: exp.patient?.id || '',
				patientId,
				phone: exp.patient?.mobile || '—',
				doctorName: exp.doctor?.display_name || exp.doctor?.expand?.user?.name || 'روانشناس',
				doctorId: String(apt.doctor || ''),
				specialty: exp.doctor?.specialty || 'روانشناسی',
				type: typeInfo.label,
				typeKey: typeInfo.key,
				notes: apt.notes ? String(apt.notes) : undefined,
				dateTime: new Date(String(apt.date_time)),
				status: mapStatus(String(apt.status))
			};
		});
	} catch (err) {
		console.error('fetchAppointments failed:', err);
		return [];
	}
}

export async function loadAppointmentsPageData(user: AuthUser): Promise<AppointmentsPageData> {
	if (!user) throw new Error('User is required');

	const appointments = await fetchAppointments(user);
	const stats = buildStatsFromList(appointments);

	const weekStart = addDays(startOfDay(new Date()), -6);
	const weekEnd = addDays(startOfDay(new Date()), 1);
	const totalThisWeek = appointments.filter(
		(a) => a.dateTime >= weekStart && a.dateTime < weekEnd && a.status !== 'cancelled'
	).length;

	return {
		stats,
		appointments,
		totalThisWeek,
		typeDistribution: buildTypeDistribution(appointments),
		trendsChartData: buildTrendsChartData(appointments)
	};
}

export function getStatusConfig(status: AppointmentListStatus) {
	const config: Record<AppointmentListStatus, { label: string; class: string }> = {
		completed: { label: 'تکمیل‌شده', class: 'bg-primary/15 text-primary' },
		ongoing: { label: 'در حال انجام', class: 'bg-sky-500 text-white' },
		scheduled: { label: 'زمان‌بندی‌شده', class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
		cancelled: { label: 'لغو‌شده', class: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
		pending: { label: 'در انتظار', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
		reserved: { label: 'رزرو', class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
		confirmed: { label: 'تأیید‌شده', class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' }
	};
	return config[status];
}
