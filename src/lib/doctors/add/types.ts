import { WEEKDAYS_FA } from '$lib/date';

export type Gender = 'female' | 'male' | 'other';
export type WorkType = 'full_time' | 'part_time';

export interface WorkingDayForm {
	day: string;
	enabled: boolean;
	startTime: string;
	endTime: string;
}

export interface UploadedCert {
	id: string;
	name: string;
	size: string;
	file?: File;
}

export interface AddDoctorForm {
	photoPreview: string | null;
	fullName: string;
	gender: Gender;
	birthDate: string;
	doctorCode: string;
	about: string;
	phone: string;
	email: string;
	address: string;
	emergencyName: string;
	emergencyPhone: string;
	department: string;
	specialization: string;
	workType: WorkType;
	startDate: string;
	visitFee: number;
	licenseNumber: string;
	licenseExpiry: string;
	certificates: UploadedCert[];
	workingDays: WorkingDayForm[];
	maxAppointmentsMin: number;
	maxAppointmentsMax: number;
	slotDuration: number;
	isActive: boolean;
}

export interface AddDoctorErrors {
	phone?: string;
	fullName?: string;
	specialization?: string;
}

export const DEPARTMENT_OPTIONS = [
	'روانشناسی بالینی',
	'نوروفیدبک',
	'خانواده درمانی',
	'کودک و نوجوان',
	'اختلالات خلقی',
	'توانبخشی شناختی',
	'مشاوره'
] as const;

export const SPECIALIZATION_OPTIONS = [
	'اضطراب و افسردگی',
	'CBT',
	'زوج‌درمانی',
	'نوجوان و تحصیلی',
	'اختلالات خلقی و فردی',
	'توانبخشی شناختی',
	'رواندرمانی'
] as const;

export function createEmptyAddDoctorForm(): AddDoctorForm {
	const code = `DR-${Math.floor(1000 + Math.random() * 9000)}`;
	return {
		photoPreview: null,
		fullName: '',
		gender: 'female',
		birthDate: '',
		doctorCode: code,
		about: '',
		phone: '',
		email: '',
		address: '',
		emergencyName: '',
		emergencyPhone: '',
		department: DEPARTMENT_OPTIONS[0],
		specialization: SPECIALIZATION_OPTIONS[0],
		workType: 'full_time',
		startDate: '',
		visitFee: 450000,
		licenseNumber: '',
		licenseExpiry: '',
		certificates: [],
		workingDays: WEEKDAYS_FA.map((day, i) => ({
			day,
			enabled: i < 5,
			startTime: '09:00',
			endTime: '17:00'
		})),
		maxAppointmentsMin: 1,
		maxAppointmentsMax: 12,
		slotDuration: 45,
		isActive: true
	};
}

export function validateAddDoctorForm(form: AddDoctorForm): AddDoctorErrors {
	const errors: AddDoctorErrors = {};
	if (!form.fullName.trim()) errors.fullName = 'نام کامل الزامی است';
	if (!/^09\d{9}$/.test(form.phone.trim())) {
		errors.phone = form.phone.trim() ? 'شماره موبایل نامعتبر است' : 'لطفاً شماره موبایل را وارد کنید';
	}
	if (!form.specialization.trim()) errors.specialization = 'تخصص الزامی است';
	return errors;
}
