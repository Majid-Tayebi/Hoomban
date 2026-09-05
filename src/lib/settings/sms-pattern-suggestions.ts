/** DB field names for appointment Verify template IDs (shared client/server). */
export const APPT_TEMPLATE_FIELDS = [
	'tpl_appt_confirmed_patient',
	'tpl_appt_confirmed_doctor',
	'tpl_appt_cancelled_patient',
	'tpl_appt_rescheduled_patient',
	'tpl_appt_rescheduled_doctor',
	'tpl_appt_reminder_patient',
	'tpl_appt_reminder_doctor'
] as const;

export type ApptTemplateField = (typeof APPT_TEMPLATE_FIELDS)[number];

export const APPT_TEMPLATE_FIELD_BY_SMS: Record<string, ApptTemplateField> = {
	appointment_confirmed: 'tpl_appt_confirmed_patient',
	doctor_new_appointment: 'tpl_appt_confirmed_doctor',
	appointment_cancelled: 'tpl_appt_cancelled_patient',
	appointment_rescheduled: 'tpl_appt_rescheduled_patient',
	doctor_appointment_rescheduled: 'tpl_appt_rescheduled_doctor',
	appointment_reminder: 'tpl_appt_reminder_patient',
	doctor_appointment_reminder: 'tpl_appt_reminder_doctor'
};

/** Suggested SMS.ir Verify patterns (register in panel, then paste IDs in admin settings). */
export const SMS_APPT_PATTERN_SUGGESTIONS: {
	field: ApptTemplateField;
	label: string;
	text: string;
	params: string;
}[] = [
	{
		field: 'tpl_appt_confirmed_patient',
		label: 'ثبت نوبت — مراجع',
		text: 'مراجع گرامی نوبت شما در تاریخ #Date# ساعت #Time# با #Doctor# در #Site# ثبت شد.',
		params: 'Date, Time, Doctor, Site'
	},
	{
		field: 'tpl_appt_confirmed_doctor',
		label: 'ثبت نوبت — متخصص',
		text: 'دکتر گرامی نوبت جدید در تاریخ #Date# ساعت #Time# توسط #Patient# رزرو شد. #Site#',
		params: 'Date, Time, Patient, Site'
	},
	{
		field: 'tpl_appt_cancelled_patient',
		label: 'لغو نوبت — مراجع',
		text: 'مراجع گرامی نوبت شما در تاریخ #Date# ساعت #Time# با #Doctor# لغو شد. #Site#',
		params: 'Date, Time, Doctor, Site'
	},
	{
		field: 'tpl_appt_rescheduled_patient',
		label: 'تغییر زمان — مراجع',
		text: 'مراجع گرامی زمان نوبت شما به تاریخ #Date# ساعت #Time# با #Doctor# تغییر یافت. #Site#',
		params: 'Date, Time, Doctor, Site'
	},
	{
		field: 'tpl_appt_rescheduled_doctor',
		label: 'تغییر زمان — متخصص',
		text: 'دکتر گرامی زمان نوبت بیمار #Patient# به تاریخ #Date# ساعت #Time# تغییر یافت. #Site#',
		params: 'Date, Time, Patient, Site'
	},
	{
		field: 'tpl_appt_reminder_patient',
		label: 'یادآوری — مراجع',
		text: 'یادآوری نوبت: تاریخ #Date# ساعت #Time# با #Doctor# در #Site#',
		params: 'Date, Time, Doctor, Site'
	},
	{
		field: 'tpl_appt_reminder_doctor',
		label: 'یادآوری — متخصص',
		text: 'یادآوری جلسه: بیمار #Patient# تاریخ #Date# ساعت #Time#. #Site#',
		params: 'Date, Time, Patient, Site'
	}
];

export const SMS_OTP_PATTERN_HINT =
	'قالب OTP جداگانه با پارامتر #CODE# (نام پارامتر در API معمولاً CODE).';
