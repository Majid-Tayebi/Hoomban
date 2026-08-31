import type { AppointmentListItem, AppointmentStat, AppointmentTypeSlice } from '../types';
import { formatPatientFileNumber } from '$lib/patients/patient-code';

export const MOCK_APPOINTMENT_STATS: AppointmentStat[] = [
	{
		id: 'today',
		label: 'نوبت‌های امروز',
		value: 52,
		trend: 2.45,
		subtext: 'ظرفیت تخت موجود ۱۸۰',
		icon: 'today'
	},
	{
		id: 'completed',
		label: 'تکمیل‌شده',
		value: 28,
		trend: 0.5,
		subtext: 'نوبت‌های ناقص ۲۴',
		icon: 'completed'
	},
	{
		id: 'ongoing',
		label: 'در حال انجام',
		value: 18,
		trend: -0.25,
		subtext: 'عملکرد کندتر از دیروز',
		icon: 'ongoing'
	},
	{
		id: 'cancelled',
		label: 'لغو‌شده',
		value: 6,
		trend: 0.1,
		subtext: 'نسبت به هفته قبل',
		icon: 'cancelled'
	}
];

export const MOCK_TYPE_DISTRIBUTION: AppointmentTypeSlice[] = [
	{ key: 'consultation', label: 'مشاوره', percent: 42, count: 42, color: '#1e7cae' },
	{ key: 'follow_up', label: 'پیگیری', percent: 28, count: 28, color: '#51afe1' },
	{ key: 'assessment', label: 'ارزیابی', percent: 18, count: 18, color: '#7cc3e9' },
	{ key: 'online', label: 'آنلاین', percent: 12, count: 12, color: '#0f3e57' }
];

export const TRENDS_CHART_DATA = {
	labels: ['شن', 'یک', 'دو', 'سه', 'چه', 'پن', 'جم'],
	datasets: [
		{
			label: 'نوبت',
			data: [12, 19, 14, 22, 18, 24, 20],
			backgroundColor: '#1e7cae',
			borderRadius: 6
		}
	]
};

const appointmentRows: Omit<AppointmentListItem, 'patientId' | 'patientUserId' | 'doctorId'>[] = [
	{
		id: '1',
		patientName: 'علی رضایی',
		phone: '09121234567',
		doctorName: 'دکتر احمدی',
		specialty: 'روانشناسی بالینی',
		type: 'مشاوره',
		typeKey: 'consultation',
		notes: 'بررسی اضطراب',
		dateTime: new Date(Date.now() + 3600000),
		status: 'scheduled'
	},
	{
		id: '2',
		patientName: 'سارا محمدی',
		phone: '09129876543',
		doctorName: 'دکتر حسینی',
		specialty: 'نوروفیدبک',
		type: 'پیگیری',
		typeKey: 'follow_up',
		notes: 'جلسه پیگیری',
		dateTime: new Date(),
		status: 'ongoing'
	},
	{
		id: '3',
		patientName: 'محمد نوری',
		phone: '09121112233',
		doctorName: 'دکتر رضایی',
		specialty: 'خانواده درمانی',
		type: 'مشاوره',
		typeKey: 'consultation',
		dateTime: new Date(Date.now() - 86400000),
		status: 'completed'
	},
	{
		id: '4',
		patientName: 'فاطمه کریمی',
		phone: '09123334455',
		doctorName: 'دکتر محمدی',
		specialty: 'کودک و نوجوان',
		type: 'ارزیابی',
		typeKey: 'assessment',
		notes: 'ارزیابی اولیه',
		dateTime: new Date(Date.now() + 172800000),
		status: 'scheduled'
	},
	{
		id: '5',
		patientName: 'حسین اکبری',
		phone: '09125556677',
		doctorName: 'دکتر احمدی',
		specialty: 'روانشناسی بالینی',
		type: 'آنلاین',
		typeKey: 'online',
		dateTime: new Date(Date.now() - 172800000),
		status: 'cancelled'
	},
	{
		id: '6',
		patientName: 'مریم صادقی',
		phone: '09127778899',
		doctorName: 'دکتر براتی',
		specialty: 'روانشناسی',
		type: 'پیگیری',
		typeKey: 'follow_up',
		dateTime: new Date(Date.now() - 3600000),
		status: 'completed'
	},
	{
		id: '7',
		patientName: 'رضا موسوی',
		phone: '09124445566',
		doctorName: 'دکتر غلامی',
		specialty: 'روانشناسی',
		type: 'مشاوره',
		typeKey: 'consultation',
		notes: 'مشاوره فردی',
		dateTime: new Date(Date.now() + 7200000),
		status: 'scheduled'
	},
	{
		id: '8',
		patientName: 'زهرا حیدری',
		phone: '09126667788',
		doctorName: 'دکتر حسنی',
		specialty: 'اختلالات خلقی',
		type: 'ارزیابی',
		typeKey: 'assessment',
		dateTime: new Date(),
		status: 'ongoing'
	},
	{
		id: '9',
		patientName: 'امیر کاظمی',
		phone: '09128889900',
		doctorName: 'دکتر حسینی',
		specialty: 'نوروفیدبک',
		type: 'مشاوره',
		typeKey: 'consultation',
		dateTime: new Date(Date.now() + 86400000),
		status: 'scheduled'
	},
	{
		id: '10',
		patientName: 'نازنین جعفری',
		phone: '09129990011',
		doctorName: 'دکتر رضایی',
		specialty: 'خانواده درمانی',
		type: 'پیگیری',
		typeKey: 'follow_up',
		dateTime: new Date(Date.now() + 259200000),
		status: 'scheduled'
	},
	{
		id: '11',
		patientName: 'پارسا ملکی',
		phone: '09121110022',
		doctorName: 'دکتر محمدی',
		specialty: 'کودک و نوجوان',
		type: 'ارزیابی',
		typeKey: 'assessment',
		dateTime: new Date(Date.now() - 259200000),
		status: 'completed'
	},
	{
		id: '12',
		patientName: 'الهام شریفی',
		phone: '09123330044',
		doctorName: 'دکتر براتی',
		specialty: 'روانشناسی',
		type: 'مشاوره',
		typeKey: 'consultation',
		dateTime: new Date(Date.now() + 432000000),
		status: 'pending'
	}
];

export const MOCK_APPOINTMENT_LIST: AppointmentListItem[] = appointmentRows.map((row, index) => ({
	...row,
	doctorId: `demo-doctor-${row.id}`,
	patientId: formatPatientFileNumber(index + 1, row.dateTime),
	patientUserId: `demo-patient-${index + 1}`
}));
