export type AppointmentListStatus =
	| 'completed'
	| 'ongoing'
	| 'scheduled'
	| 'cancelled'
	| 'pending'
	| 'reserved'
	| 'confirmed';

export type AppointmentTypeKey = 'consultation' | 'follow_up' | 'assessment' | 'online';

export interface AppointmentStat {
	id: string;
	label: string;
	value: number;
	trend?: number;
	subtext?: string;
	icon: 'today' | 'completed' | 'ongoing' | 'cancelled';
}

export interface AppointmentTypeSlice {
	key: AppointmentTypeKey;
	label: string;
	percent: number;
	count: number;
	color: string;
}

export interface AppointmentListItem {
	id: string;
	patientName: string;
	/** Formatted patient file code for display */
	patientId: string;
	/** PocketBase user id for navigation */
	patientUserId: string;
	phone: string;
	doctorName: string;
	doctorId: string;
	specialty: string;
	type: string;
	typeKey: AppointmentTypeKey;
	notes?: string;
	dateTime: Date;
	status: AppointmentListStatus;
}

export interface AppointmentsPageData {
	stats: AppointmentStat[];
	appointments: AppointmentListItem[];
	totalThisWeek: number;
	typeDistribution: AppointmentTypeSlice[];
	trendsChartData: {
		labels: string[];
		datasets: {
			label: string;
			data: number[];
			backgroundColor: string;
			borderRadius: number;
		}[];
	};
}
