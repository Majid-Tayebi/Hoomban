export type AppointmentStatus =
	| 'completed'
	| 'scheduled'
	| 'cancelled'
	| 'pending'
	| 'reserved'
	| 'confirmed'
	| 'ongoing';

export type DashboardRoleView = 'admin' | 'secretary' | 'doctor' | 'patient' | 'writer';

export type StatIcon =
	| 'visitors'
	| 'patients'
	| 'appointments'
	| 'doctors'
	| 'today'
	| 'upcoming'
	| 'completed'
	| 'articles'
	| 'revenue';

export interface DashboardStat {
	id: string;
	label: string;
	value: number;
	trend?: number;
	trendLabel?: string;
	subtext?: string;
	icon: StatIcon;
}

export interface DashboardAppointment {
	id: string;
	patientName: string;
	/** Formatted patient file code for display */
	patientId: string;
	/** PocketBase user id for navigation */
	patientUserId: string;
	phone: string;
	doctorName: string;
	specialty: string;
	type: string;
	dateTime: Date;
	status: AppointmentStatus;
}

export interface DoctorScheduleItem {
	id: string;
	name: string;
	specialty: string;
	initials: string;
	photoUrl: string | null;
	activeToday: boolean;
	timeSlot?: string;
	appointmentCount: number;
}

export interface QuickLink {
	id: string;
	label: string;
	href: string;
	description: string;
	icon: 'calendar' | 'patients' | 'doctors' | 'book' | 'tests' | 'articles' | 'schedule';
}

export interface DashboardData {
	role: DashboardRoleView;
	greeting: string;
	subtitle: string;
	stats: DashboardStat[];
	appointments: DashboardAppointment[];
	appointmentsTitle: string;
	doctors: DoctorScheduleItem[];
	quickLinks: QuickLink[];
	showDoctorsPanel: boolean;
}
