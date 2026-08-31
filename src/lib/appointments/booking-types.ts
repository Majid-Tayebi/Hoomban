export type TimeSlot = {
	startTime: string;
	endTime: string;
};

export type BookingWorkingDay = {
	day: string;
	enabled: boolean;
	slots?: TimeSlot[];
	/** @deprecated use slots — kept for legacy records */
	startTime?: string;
	endTime?: string;
};

export type BookingDoctor = {
	id: string;
	name: string;
	specialty: string;
	visitFee: number;
	slotDuration: number;
	photo?: string;
	workingDays: BookingWorkingDay[];
	scheduleDates?: Record<string, { enabled: boolean; slots: TimeSlot[] }>;
};

export type BookingSlot = {
	time: string;
	date: Date;
	doctorId: string;
};

export type BookingClient = {
	firstName: string;
	lastName: string;
	mobile: string;
};

export type BookingTimelineStep = {
	id: number;
	title: string;
	description: string;
};

export type BookingPath = 'specialist' | 'service';

export type BookingService = {
	id: string;
	title: string;
	slug: string;
	category: string;
	description: string;
	price: number;
};
