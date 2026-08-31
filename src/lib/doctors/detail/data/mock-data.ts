import type {
	DoctorDetailData,
	DoctorFeedback,
	DoctorPatientRow,
	DoctorScheduleSlot,
	DoctorStatCard
} from '../types';
import { formatPatientFileNumber } from '$lib/patients/patient-code';

export const MOCK_STATS: DoctorStatCard[] = [
	{
		id: 'appointments',
		label: 'کل نوبت‌ها',
		value: 620,
		trend: 9,
		trendLabel: 'نسبت به ماه قبل'
	},
	{
		id: 'patients',
		label: 'کل بیماران',
		value: 410,
		trend: 5,
		trendLabel: 'نسبت به فصل قبل'
	}
];

export const MOCK_FEEDBACK: DoctorFeedback[] = [
	{
		id: '1',
		patientName: 'علی رضایی',
		rating: 4.8,
		text: 'جلسات بسیار مفید بود و حس آرامش بیشتری دارم. سپاسگزارم.',
		date: '۲۰ بهمن ۱۴۰۳'
	},
	{
		id: '2',
		patientName: 'سارا محمدی',
		rating: 5,
		text: 'توضیحات دقیق و برخورد حرفه‌ای. پیشنهاد می‌کنم.',
		date: '۱۸ بهمن ۱۴۰۳'
	},
	{
		id: '3',
		patientName: 'محمد نوری',
		rating: 4.9,
		text: 'برنامه درمانی منظم و پیگیری عالی بود.',
		date: '۱۵ بهمن ۱۴۰۳'
	}
];

export const MOCK_SCHEDULE: DoctorScheduleSlot[] = [
	{
		id: '1',
		patientName: 'فاطمه کریمی',
		patientInitials: 'ف.ک',
		type: 'پیگیری',
		timeRange: '۰۹:۰۰ – ۰۹:۴۵'
	},
	{
		id: '2',
		patientName: 'حسین اکبری',
		patientInitials: 'ح.ا',
		type: 'مشاوره',
		timeRange: '۱۰:۰۰ – ۱۰:۴۵'
	},
	{
		id: '3',
		patientName: 'مریم صادقی',
		patientInitials: 'م.ص',
		type: 'آنلاین',
		timeRange: '۱۱:۳۰ – ۱۲:۱۵'
	},
	{
		id: '4',
		patientName: 'رضا موسوی',
		patientInitials: 'ر.م',
		type: 'ارزیابی',
		timeRange: '۱۴:۰۰ – ۱۴:۴۵'
	}
];

export const MOCK_PATIENTS: DoctorPatientRow[] = [
	{
		id: '1',
		name: 'فاطمه کریمی',
		patientCode: formatPatientFileNumber(4, '2025-03-12'),
		checkInDate: '۱۲ اسفند ۱۴۰۳',
		condition: 'اضطراب',
		treatment: 'CBT + دارودرمانی',
		status: 'in_treatment'
	},
	{
		id: '2',
		name: 'حسین اکبری',
		patientCode: formatPatientFileNumber(5, '2025-03-09'),
		checkInDate: '۱۰ اسفند ۱۴۰۳',
		condition: 'اختلال خواب',
		treatment: 'بهداشت خواب',
		status: 'admitted'
	},
	{
		id: '3',
		name: 'مریم صادقی',
		patientCode: formatPatientFileNumber(6, '2025-03-07'),
		checkInDate: '۸ اسفند ۱۴۰۳',
		condition: 'مشاوره زوجین',
		treatment: 'جلسات زوج‌درمانی',
		status: 'in_treatment'
	},
	{
		id: '4',
		name: 'رضا موسوی',
		patientCode: formatPatientFileNumber(7, '2025-03-13'),
		checkInDate: '۵ اسفند ۱۴۰۳',
		condition: 'وسواس',
		treatment: 'ERP',
		status: 'discharged'
	},
	{
		id: '5',
		name: 'زهرا حیدری',
		patientCode: formatPatientFileNumber(8, '2025-03-06'),
		checkInDate: '۳ اسفند ۱۴۰۳',
		condition: 'افسردگی',
		treatment: 'روان‌درمانی',
		status: 'admitted'
	}
];

export const PATIENT_OVERVIEW_CHART = {
	labels: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'],
	datasets: [
		{
			type: 'bar' as const,
			label: 'بستری',
			data: [12, 18, 15, 23, 16, 20, 14],
			backgroundColor: '#7cc3e9',
			borderRadius: 4,
			barThickness: 14,
			order: 2
		},
		{
			type: 'line' as const,
			label: 'سرپایی',
			data: [28, 35, 32, 47, 38, 42, 30],
			borderColor: '#1e7cae',
			backgroundColor: 'rgba(53, 88, 114, 0.12)',
			fill: false,
			tension: 0.35,
			pointRadius: 3,
			order: 1
		}
	]
};

export const overviewChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			display: true,
			position: 'top' as const,
			align: 'end' as const,
			labels: { font: { family: 'Vazirmatn', size: 11 }, boxWidth: 10, padding: 12 }
		}
	},
	scales: {
		x: {
			grid: { display: false },
			ticks: { font: { family: 'Vazirmatn', size: 10 } }
		},
		y: {
			beginAtZero: true,
			grid: { color: 'rgba(0,0,0,0.04)' },
			ticks: { font: { family: 'Vazirmatn', size: 10 } }
		}
	}
};

export function buildDemoDoctorDetail(id: string): DoctorDetailData {
	return {
		profile: {
			id,
			code: 'DR-1005',
			displayName: 'دکتر سارا احمدی',
			specialty: 'روانشناسی بالینی',
			experience: '۱۱+ سال',
			availability: 'available',
			bio: 'متخصص روانشناسی بالینی با تمرکز بر اضطراب، افسردگی و درمان شناختی‌رفتاری. رویکردی همدلانه و مبتنی بر شواهد برای همراهی بیماران در مسیر بهبود.',
			room: 'اتاق ۲۰۴ — طبقه ۲',
			phone: '021-55502035',
			email: 'sara.ahmadi@hoomban.ir',
			joinDate: '۱۵ دی ۱۳۸۴',
			emergencyContact: 'کیوان احمدی — ۰۹۱۲۱۱۱۱۱۱۱',
			address: 'تهران، خیابان ولیعصر، کلینیک هومبان',
			visitFee: 450000,
			slotDuration: 45
		},
		satisfaction: { percent: 88, trend: 0.5, count: 1739 },
		stats: MOCK_STATS,
		feedback: MOCK_FEEDBACK,
		schedule: MOCK_SCHEDULE,
		patients: MOCK_PATIENTS
	};
}
