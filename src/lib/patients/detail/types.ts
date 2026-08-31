export interface PatientContactInfo {
	phone: string;
	email: string;
	address: string;
	emergencyContact: string;
}

export interface PatientMetaField {
	label: string;
	value: string;
}

export interface PatientVital {
	id: string;
	label: string;
	value: string;
	icon: 'sugar' | 'weight' | 'temp';
}

export interface HealthReport {
	id: string;
	title: string;
	date: string;
	size: string;
}

export interface PatientCondition {
	id: string;
	label: string;
}

export interface PatientAllergy {
	id: string;
	label: string;
	color: string;
}

export interface MedicationItem {
	id: string;
	name: string;
	dosage: string;
	frequency: string;
	period: string;
	status: 'active' | 'completed' | 'discontinued';
}

export interface PatientAppointmentRow {
	id: string;
	dateTime: Date;
	timeRange: string;
	type: string;
	kind: 'specialist' | 'service';
	/** Display in table: specialist name or service title */
	displayName: string;
	specialistName?: string;
	serviceName?: string;
	status: string;
	note: string;
}

export interface ClinicalNoteRow {
	id: string;
	text: string;
	treatmentPlan: string;
	sessionDate?: string;
	audio: string[];
	doctorName: string;
}

export type PatientReferralStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';

export interface PatientReferralRow {
	id: string;
	fromDoctorId: string;
	toDoctorId: string;
	fromDoctorName: string;
	toDoctorName: string;
	reason: string;
	clinicalSummary: string;
	status: PatientReferralStatus;
	created: string;
}

export type PatientAttachmentCategory = 'photo' | 'document' | 'prior_record';

export interface PatientAttachmentRow {
	id: string;
	title: string;
	category: PatientAttachmentCategory;
	notes: string;
	fileName: string;
	mimeType: string;
	created: string;
}

export interface PatientDetailProfile {
	id?: string;
	summary: string;
	nationalId: string;
	emergencyContact: string;
	birthDate?: string;
}

export interface PatientDetailData {
	id: string;
	name: string;
	patientCode: string;
	avatarUrl?: string | null;
	contact: PatientContactInfo;
	meta: PatientMetaField[];
	vitals: PatientVital[];
	reports: HealthReport[];
	conditions: PatientCondition[];
	allergies: PatientAllergy[];
	medications: MedicationItem[];
	appointments: PatientAppointmentRow[];
	profile: PatientDetailProfile;
	notes: ClinicalNoteRow[];
	referrals: PatientReferralRow[];
	attachments: PatientAttachmentRow[];
	vitalsChart: {
		labels: string[];
		datasets: {
			label: string;
			data: number[];
			backgroundColor: string;
			borderRadius?: number;
			barThickness?: number;
		}[];
	} | null;
}
