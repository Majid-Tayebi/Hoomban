export type CalendarView = 'month' | 'week' | 'day';

export type ScheduleCategoryId = 'appointment' | 'service';

export type CalendarFilterMode = 'all' | ScheduleCategoryId;

export interface ScheduleCategory {
	id: ScheduleCategoryId;
	label: string;
	tone: 'sky' | 'violet';
	count: number;
}

export interface ScheduleLead {
	name: string;
	role: string;
	initials: string;
}

export interface ScheduleEvent {
	id: string;
	title: string;
	category: ScheduleCategoryId;
	/** Local calendar date YYYY-MM-DD */
	date: string;
	startTime: string;
	endTime: string;
	location: string;
	participants: string;
	lead: ScheduleLead;
	note: string;
	statusLabel?: string;
	patientId?: string;
	appointmentId?: string;
	/** Set when appointment is a booked clinic service (not a specialist visit). */
	serviceTitle?: string;
}

export interface CalendarDayCell {
	date: Date;
	iso: string;
	/** Jalali day-of-month for display */
	day: number;
	inCurrentMonth: boolean;
	isToday: boolean;
	events: ScheduleEvent[];
}

export interface CalendarPageData {
	events: ScheduleEvent[];
	categories: ScheduleCategory[];
	totalSchedules: number;
}
