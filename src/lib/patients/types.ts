export type PatientGender = 'male' | 'female' | 'unknown';

export type PatientCareStatus = 'admitted' | 'in_treatment' | 'discharged';

export interface PatientListItem {
	id: string;
	name: string;
	patientCode: string;
	mobile: string;
	gender: PatientGender;
	condition: string;
	doctorName: string;
	specialty: string;
	admissionDate: Date | null;
	status: PatientCareStatus;
}

export interface PatientFilters {
	gender: string;
	condition: string;
	query: string;
}

export interface PatientsPageData {
	patients: PatientListItem[];
}
