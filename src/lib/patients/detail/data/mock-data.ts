import type {
	HealthReport,
	MedicationItem,
	PatientAllergy,
	PatientCondition,
	PatientMetaField,
	PatientVital
} from '../types';

export const MOCK_VITALS: PatientVital[] = [
	{ id: 'sugar', label: 'قند خون', value: '۱۷۱ mg/dL', icon: 'sugar' },
	{ id: 'weight', label: 'وزن بدن', value: '۶۲ کیلوگرم', icon: 'weight' },
	{ id: 'temp', label: 'دمای بدن', value: '۳۷°C', icon: 'temp' }
];

export const MOCK_META: PatientMetaField[] = [
	{ label: 'سن / جنسیت', value: '۴۲ / مرد' },
	{ label: 'تاریخ تولد', value: '۲۹ تیر ۱۳۶۲' },
	{ label: 'گروه خونی', value: 'O+' },
	{ label: 'شغل', value: 'مدیر پروژه' },
	{ label: 'وضعیت', value: 'سرپایی — پیگیری' },
	{ label: 'بیمه', value: 'تأمین اجتماعی' }
];

export const MOCK_REPORTS: HealthReport[] = [
	{
		id: '1',
		title: 'گزارش ارزیابی اولیه روانشناختی',
		date: '۲۲ بهمن ۱۴۰۳',
		size: '۱.۲ MB'
	},
	{
		id: '2',
		title: 'نتایج تست MMPI',
		date: '۱۵ بهمن ۱۴۰۳',
		size: '۸۴۰ KB'
	},
	{
		id: '3',
		title: 'خلاصه جلسه خانواده درمانی',
		date: '۸ بهمن ۱۴۰۳',
		size: '۵۲۰ KB'
	}
];

export const MOCK_CONDITIONS: PatientCondition[] = [
	{ id: '1', label: 'اضطراب فراگیر' },
	{ id: '2', label: 'اختلال خواب' }
];

export const MOCK_ALLERGIES: PatientAllergy[] = [
	{ id: '1', label: 'پنیسیلین', color: '#ef4444' },
	{ id: '2', label: 'آسپرین', color: '#f59e0b' },
	{ id: '3', label: 'بادام‌زمینی', color: '#10b981' },
	{ id: '4', label: 'گرد و غبار', color: '#3b82f6' }
];

export const MOCK_MEDICATIONS: MedicationItem[] = [
	{
		id: '1',
		name: 'سرترالین',
		dosage: '۵۰ میلی‌گرم',
		frequency: 'روزانه — صبح',
		period: '۱ دی ۱۴۰۳ – ادامه',
		status: 'active'
	},
	{
		id: '2',
		name: 'ملاتونین',
		dosage: '۳ میلی‌گرم',
		frequency: 'شبانه',
		period: '۱۵ دی – ۱۵ بهمن',
		status: 'completed'
	},
	{
		id: '3',
		name: 'پروپرانولول',
		dosage: '۱۰ میلی‌گرم',
		frequency: 'در صورت نیاز',
		period: 'متوقف‌شده',
		status: 'discontinued'
	}
];

export const BP_CHART_DATA = {
	labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
	datasets: [
		{
			label: 'ضربان قلب',
			data: [72, 78, 75, 82, 70, 74, 80, 76, 73, 79, 77, 81],
			backgroundColor: '#1e7cae',
			borderRadius: 4,
			barThickness: 10
		},
		{
			label: 'فشار خون',
			data: [110, 118, 115, 120, 108, 112, 116, 114, 111, 119, 113, 117],
			backgroundColor: '#51afe1',
			borderRadius: 4,
			barThickness: 10
		}
	]
};

export const bpChartOptions = {
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
			beginAtZero: false,
			grid: { color: 'rgba(0,0,0,0.04)' },
			ticks: { font: { family: 'Vazirmatn', size: 10 } }
		}
	}
};
