import { describe, expect, it } from 'vitest';
import { maskApiKey, toPublicSmsSettings } from '$lib/server/sms/sms-settings';
import { getAppointmentVerifyTemplateId, type ResolvedSmsConfig } from '$lib/server/sms/smsir-config';
import {
	APPT_TEMPLATE_FIELD_BY_SMS,
	SMS_APPT_PATTERN_SUGGESTIONS
} from '$lib/settings/sms-pattern-suggestions';

describe('sms settings helpers', () => {
	it('masks api keys without exposing the full secret', () => {
		expect(maskApiKey('')).toBe('');
		expect(maskApiKey('abcd')).toBe('••••');
		expect(maskApiKey('secret-key-9876')).toBe('••••9876');
	});

	it('maps appointment templates to verify IDs when configured', () => {
		const cfg: ResolvedSmsConfig = {
			apiKey: 'k',
			lineNumber: 3000,
			otpTemplateId: 1,
			otpParam: 'CODE',
			appointmentTemplateIds: {
				appointment_confirmed: 111,
				doctor_new_appointment: 222
			}
		};
		expect(getAppointmentVerifyTemplateId(cfg, 'appointment_confirmed')).toBe(111);
		expect(getAppointmentVerifyTemplateId(cfg, 'doctor_new_appointment')).toBe(222);
		expect(getAppointmentVerifyTemplateId(cfg, 'appointment_cancelled')).toBeNull();
		expect(getAppointmentVerifyTemplateId(cfg, 'custom')).toBeNull();
	});

	it('keeps seven pattern suggestions aligned with internal template keys', () => {
		expect(SMS_APPT_PATTERN_SUGGESTIONS).toHaveLength(7);
		const fields = new Set(SMS_APPT_PATTERN_SUGGESTIONS.map((p) => p.field));
		expect(fields.size).toBe(7);
		for (const field of Object.values(APPT_TEMPLATE_FIELD_BY_SMS)) {
			expect(fields.has(field)).toBe(true);
		}
	});

	it('public settings view never includes the raw api key', () => {
		const publicView = toPublicSmsSettings({
			recordId: 'x',
			apiKey: 'secret-key-9876',
			lineNumber: '3000',
			otpTemplateId: '166356',
			otpParam: 'CODE',
			templates: {
				tpl_appt_confirmed_patient: '1',
				tpl_appt_confirmed_doctor: '',
				tpl_appt_cancelled_patient: '',
				tpl_appt_rescheduled_patient: '',
				tpl_appt_rescheduled_doctor: '',
				tpl_appt_reminder_patient: '',
				tpl_appt_reminder_doctor: ''
			}
		});
		expect(JSON.stringify(publicView)).not.toContain('secret-key-9876');
		expect(publicView).not.toHaveProperty('apiKey');
		expect(publicView.apiKeyMasked).toBe('••••9876');
		expect(publicView.hasApiKey).toBe(true);
	});
});
