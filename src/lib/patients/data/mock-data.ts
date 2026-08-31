import type { PatientListItem } from '../types';
import { formatPatientFileNumber } from '../patient-code';

const rows: Omit<PatientListItem, 'patientCode'>[] = [
	{
		id: '1',
		name: 'علی رضایی',
		mobile: '09121234567',
		gender: 'male',
		condition: 'اضطراب',
		doctorName: 'دکتر احمدی',
		specialty: 'روانشناسی بالینی',
		admissionDate: new Date('2025-03-11'),
		status: 'in_treatment'
	},
	{
		id: '2',
		name: 'سارا محمدی',
		mobile: '09129876543',
		gender: 'female',
		condition: 'افسردگی',
		doctorName: 'دکتر حسینی',
		specialty: 'نوروفیدبک',
		admissionDate: new Date('2025-03-10'),
		status: 'admitted'
	},
	{
		id: '3',
		name: 'محمد نوری',
		mobile: '09121112233',
		gender: 'male',
		condition: 'اختلال خواب',
		doctorName: 'دکتر رضایی',
		specialty: 'خانواده درمانی',
		admissionDate: new Date('2025-03-08'),
		status: 'discharged'
	},
	{
		id: '4',
		name: 'فاطمه کریمی',
		mobile: '09123334455',
		gender: 'female',
		condition: 'اضطراب امتحان',
		doctorName: 'دکتر محمدی',
		specialty: 'کودک و نوجوان',
		admissionDate: new Date('2025-03-12'),
		status: 'in_treatment'
	},
	{
		id: '5',
		name: 'حسین اکبری',
		mobile: '09125556677',
		gender: 'male',
		condition: 'استرس شغلی',
		doctorName: 'دکتر براتی',
		specialty: 'روانشناسی',
		admissionDate: new Date('2025-03-09'),
		status: 'admitted'
	},
	{
		id: '6',
		name: 'مریم صادقی',
		mobile: '09127778899',
		gender: 'female',
		condition: 'مشاوره زوجین',
		doctorName: 'دکتر غلامی',
		specialty: 'خانواده درمانی',
		admissionDate: new Date('2025-03-07'),
		status: 'discharged'
	},
	{
		id: '7',
		name: 'رضا موسوی',
		mobile: '09124445566',
		gender: 'male',
		condition: 'وسواس',
		doctorName: 'دکتر حسنی',
		specialty: 'اختلالات خلقی',
		admissionDate: new Date('2025-03-13'),
		status: 'in_treatment'
	},
	{
		id: '8',
		name: 'زهرا حیدری',
		mobile: '09126667788',
		gender: 'female',
		condition: 'سوگ',
		doctorName: 'دکتر احمدی',
		specialty: 'روانشناسی بالینی',
		admissionDate: new Date('2025-03-06'),
		status: 'admitted'
	},
	{
		id: '9',
		name: 'امیر کاظمی',
		mobile: '09128889900',
		gender: 'male',
		condition: 'اضطراب',
		doctorName: 'دکتر حسینی',
		specialty: 'نوروفیدبک',
		admissionDate: new Date('2026-01-15'),
		status: 'in_treatment'
	},
	{
		id: '10',
		name: 'نازنین جعفری',
		mobile: '09129990011',
		gender: 'female',
		condition: 'افسردگی',
		doctorName: 'دکتر رضایی',
		specialty: 'خانواده درمانی',
		admissionDate: new Date('2026-02-20'),
		status: 'admitted'
	},
	{
		id: '11',
		name: 'پارسا ملکی',
		mobile: '09121110022',
		gender: 'male',
		condition: 'استرس',
		doctorName: 'دکتر محمدی',
		specialty: 'کودک و نوجوان',
		admissionDate: new Date('2026-03-01'),
		status: 'in_treatment'
	},
	{
		id: '12',
		name: 'الهام شریفی',
		mobile: '09123330044',
		gender: 'female',
		condition: 'سوگ',
		doctorName: 'دکتر براتی',
		specialty: 'روانشناسی',
		admissionDate: new Date('2026-03-05'),
		status: 'discharged'
	}
];

export const MOCK_PATIENTS: PatientListItem[] = rows.map((row, index) => ({
	...row,
	patientCode: formatPatientFileNumber(index + 1, row.admissionDate)
}));

export const CONDITION_OPTIONS = [
	'همه',
	'اضطراب',
	'افسردگی',
	'اختلال خواب',
	'استرس شغلی',
	'وسواس',
	'مشاوره زوجین',
	'سوگ'
] as const;
