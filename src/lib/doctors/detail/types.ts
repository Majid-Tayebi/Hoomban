export interface DoctorDetailProfile {
	id: string;
	code: string;
	displayName: string;
	specialty: string;
	experience: string;
	availability: 'available' | 'unavailable';
	photo?: string;
	bio: string;
	room: string;
	phone: string;
	email: string;
	joinDate: string;
	emergencyContact: string;
	address: string;
	visitFee: number;
	slotDuration: number;
}

export interface DoctorStatCard {
	id: string;
	label: string;
	value: number;
	trend: number;
	trendLabel: string;
}

export interface DoctorFeedback {
	id: string;
	patientName: string;
	rating: number;
	text: string;
	date: string;
}

export interface DoctorScheduleSlot {
	id: string;
	patientName: string;
	patientInitials: string;
	type: string;
	timeRange: string;
}

export interface DoctorPatientRow {
	id: string;
	name: string;
	patientCode: string;
	checkInDate: string;
	condition: string;
	treatment: string;
	status: 'in_treatment' | 'discharged' | 'admitted';
}

export interface DoctorDetailData {
	profile: DoctorDetailProfile;
	satisfaction: { percent: number; trend: number; count: number };
	stats: DoctorStatCard[];
	feedback: DoctorFeedback[];
	schedule: DoctorScheduleSlot[];
	patients: DoctorPatientRow[];
}
