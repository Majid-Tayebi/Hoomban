export type DoctorAvailability = 'available' | 'unavailable';

export interface DoctorCardItem {
	id: string;
	displayName: string;
	specialty: string;
	visitFee: number;
	slotDuration: number;
	bio: string;
	isActive: boolean;
	availability: DoctorAvailability;
	photo?: string;
	user?: string;
	mobile?: string;
	workingHours: string;
	location?: string;
}

export interface DoctorFilters {
	query: string;
	status: 'all' | DoctorAvailability;
	specialty: string;
}

export interface DoctorsPageData {
	doctors: DoctorCardItem[];
	specialties: string[];
}

export type DoctorEditForm = {
	id: string;
	displayName: string;
	specialty: string;
	visitFee: number;
	slotDuration: number;
	bio: string;
	isActive: boolean;
};
