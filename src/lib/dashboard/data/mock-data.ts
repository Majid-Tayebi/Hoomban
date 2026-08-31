import type { DashboardAppointment, DashboardStat, DoctorScheduleItem } from '../types';
import { formatPatientFileNumber } from '$lib/patients/patient-code';

export const MOCK_STATS: DashboardStat[] = [
	{ id: 'patients', label: 'مراجعان', value: 128, subtext: 'نمونه', icon: 'patients' },
	{ id: 'today', label: 'نوبت امروز', value: 14, subtext: 'نمونه', icon: 'today' },
	{ id: 'week', label: 'نوبت این هفته', value: 62, subtext: 'نمونه', icon: 'appointments' },
	{
		id: 'revenue',
		label: 'درآمد ماه جاری',
		value: 18_500_000,
		subtext: 'تومان — از نوبت‌های غیرلغو',
		icon: 'revenue'
	}
];

export const MOCK_APPOINTMENTS: DashboardAppointment[] = [
	{
		id: '1',
		patientName: 'علی رضایی',
		patientId: formatPatientFileNumber(1024, '2026-08-01'),
		patientUserId: 'demo-patient-1',
		phone: '09121234567',
		doctorName: 'دکتر احمدی',
		specialty: 'روانشناسی بالینی',
		type: 'مشاوره',
		dateTime: new Date(Date.now() + 86400000),
		status: 'scheduled'
	},
	{
		id: '2',
		patientName: 'سارا محمدی',
		patientId: formatPatientFileNumber(1025, '2026-07-15'),
		patientUserId: 'demo-patient-2',
		phone: '09129876543',
		doctorName: 'دکتر حسینی',
		specialty: 'نوروفیدبک',
		type: 'پیگیری',
		dateTime: new Date(Date.now() + 172800000),
		status: 'completed'
	},
	{
		id: '3',
		patientName: 'محمد نوری',
		patientId: formatPatientFileNumber(1026, '2026-06-20'),
		patientUserId: 'demo-patient-3',
		phone: '09121112233',
		doctorName: 'دکتر رضایی',
		specialty: 'خانواده درمانی',
		type: 'مشاوره',
		dateTime: new Date(Date.now() - 86400000),
		status: 'cancelled'
	},
	{
		id: '4',
		patientName: 'فاطمه کریمی',
		patientId: formatPatientFileNumber(1027, '2026-05-10'),
		patientUserId: 'demo-patient-4',
		phone: '09123334455',
		doctorName: 'دکتر محمدی',
		specialty: 'کودک و نوجوان',
		type: 'ارزیابی',
		dateTime: new Date(),
		status: 'scheduled'
	}
];

export const MOCK_DOCTORS: DoctorScheduleItem[] = [
	{
		id: '1',
		name: 'دکتر احمدی',
		specialty: 'روانشناسی بالینی',
		initials: 'دا',
		photoUrl: null,
		activeToday: true,
		timeSlot: '۹:۰۰ – ۱۷:۰۰',
		appointmentCount: 3
	},
	{
		id: '2',
		name: 'دکتر حسینی',
		specialty: 'نوروفیدبک',
		initials: 'دح',
		photoUrl: null,
		activeToday: true,
		timeSlot: '۱۰:۰۰ – ۱۴:۰۰',
		appointmentCount: 1
	},
	{
		id: '3',
		name: 'دکتر رضایی',
		specialty: 'خانواده درمانی',
		initials: 'در',
		photoUrl: null,
		activeToday: false,
		timeSlot: undefined,
		appointmentCount: 0
	}
];

export const DEPARTMENT_CHART_DATA = {
	labels: ['بالینی', 'نوروفیدبک', 'خانواده', 'کودک', 'خلقی'],
	datasets: [
		{
			data: [32, 18, 22, 16, 12],
			backgroundColor: ['#1e7cae', '#51afe1', '#7cc3e9', '#ebf5f9', '#0f3e57'],
			borderWidth: 0
		}
	]
};
