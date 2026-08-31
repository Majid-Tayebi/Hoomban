export const PATIENT_CANCEL_MIN_HOURS = 24;

export function hoursUntilAppointment(dateTime: Date | string): number {
	const ms =
		typeof dateTime === 'string' ? new Date(dateTime).getTime() : dateTime.getTime();
	return (ms - Date.now()) / (1000 * 60 * 60);
}

export function canPatientCancelByTime(
	dateTime: Date | string,
	minHours = PATIENT_CANCEL_MIN_HOURS
): boolean {
	return hoursUntilAppointment(dateTime) >= minHours;
}

export const PATIENT_CANCEL_TOO_LATE_MESSAGE =
	'برای لغو کمتر از ۲۴ ساعت قبل از نوبت، لطفاً با منشی مطب تماس بگیرید.';

export const PATIENT_CANCEL_REFUND_NOTE =
	'در صورت پرداخت آنلاین، مبلغ تا ۷۲ ساعت کاری به حساب شما بازگردانده می‌شود.';
