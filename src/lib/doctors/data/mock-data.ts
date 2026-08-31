import type { DoctorCardItem } from '../types';

export const DEFAULT_SPECIALTIES = [
	'همه',
	'روانشناسی بالینی',
	'نوروفیدبک',
	'خانواده درمانی',
	'کودک و نوجوان',
	'اختلالات خلقی',
	'توانبخشی شناختی'
] as const;

export const MOCK_DOCTORS: DoctorCardItem[] = [
	{
		id: '1',
		displayName: 'دکتر سارا احمدی',
		specialty: 'روانشناسی بالینی',
		visitFee: 450000,
		slotDuration: 45,
		bio: '',
		isActive: true,
		availability: 'available',
		mobile: '09121234567',
		workingHours: 'شنبه تا چهارشنبه (۹:۰۰ – ۱۷:۰۰)',
		location: 'کلینیک هومبان، تهران'
	},
	{
		id: '2',
		displayName: 'دکتر کیوان محمدی',
		specialty: 'نوروفیدبک',
		visitFee: 550000,
		slotDuration: 50,
		bio: '',
		isActive: true,
		availability: 'available',
		mobile: '09129876543',
		workingHours: 'یکشنبه تا پنج‌شنبه (۱۰:۰۰ – ۱۸:۰۰)',
		location: 'کلینیک هومبان، تهران'
	},
	{
		id: '3',
		displayName: 'دکتر مریم حسینی',
		specialty: 'خانواده درمانی',
		visitFee: 500000,
		slotDuration: 60,
		bio: '',
		isActive: false,
		availability: 'unavailable',
		mobile: '09121112233',
		workingHours: 'مرخصی',
		location: 'کلینیک هومبان، تهران'
	},
	{
		id: '4',
		displayName: 'دکتر رضا نوری',
		specialty: 'کودک و نوجوان',
		visitFee: 420000,
		slotDuration: 45,
		bio: '',
		isActive: true,
		availability: 'available',
		mobile: '09123334455',
		workingHours: 'شنبه تا سه‌شنبه (۸:۰۰ – ۱۴:۰۰)',
		location: 'کلینیک هومبان، تهران'
	},
	{
		id: '5',
		displayName: 'دکتر بهناز غلامی',
		specialty: 'روانشناسی بالینی',
		visitFee: 480000,
		slotDuration: 45,
		bio: '',
		isActive: true,
		availability: 'available',
		mobile: '09124445566',
		workingHours: 'شنبه تا پنج‌شنبه (۹:۰۰ – ۱۵:۰۰)',
		location: 'کلینیک هومبان، تهران'
	},
	{
		id: '6',
		displayName: 'دکتر ناهید براتی',
		specialty: 'اختلالات خلقی',
		visitFee: 520000,
		slotDuration: 50,
		bio: '',
		isActive: false,
		availability: 'unavailable',
		mobile: '09125556677',
		workingHours: 'غیرفعال',
		location: 'کلینیک هومبان، تهران'
	},
	{
		id: '7',
		displayName: 'دکتر ثمین حسنی',
		specialty: 'اختلالات خلقی',
		visitFee: 500000,
		slotDuration: 45,
		bio: '',
		isActive: true,
		availability: 'available',
		mobile: '09126667788',
		workingHours: 'دوشنبه تا جمعه (۱۱:۰۰ – ۱۹:۰۰)',
		location: 'کلینیک هومبان، تهران'
	},
	{
		id: '8',
		displayName: 'دکتر سپیده عباسی',
		specialty: 'خانواده درمانی',
		visitFee: 470000,
		slotDuration: 60,
		bio: '',
		isActive: true,
		availability: 'available',
		mobile: '09127778899',
		workingHours: 'شنبه تا چهارشنبه (۱۰:۰۰ – ۱۶:۰۰)',
		location: 'کلینیک هومبان، تهران'
	}
];
