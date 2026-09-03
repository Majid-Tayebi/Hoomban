import { describe, expect, it } from 'vitest';
import {
	canAccessPath,
	canViewClinicalNotes,
	canWriteClinicalNotes,
	getPatientRecordHref
} from '$lib/rbac';
import {
	canCancelAppointmentStatus,
	canManageAppointmentActions,
	canRescheduleAppointmentStatus
} from '$lib/appointments/appointment-acl';

describe('appointment / desk ACL helpers', () => {
	it('routes secretary to desk patient file, doctor to clinical record', () => {
		expect(getPatientRecordHref('p1', 'secretary')).toBe('/dashboard/desk/patients/p1');
		expect(getPatientRecordHref('p1', 'doctor')).toBe('/dashboard/patients/p1');
		expect(getPatientRecordHref('p1', 'patient')).toBe('/dashboard');
	});

	it('blocks secretary from clinical notes write/view helpers', () => {
		expect(canViewClinicalNotes('secretary')).toBe(false);
		expect(canWriteClinicalNotes('secretary')).toBe(false);
		expect(canViewClinicalNotes('doctor')).toBe(true);
		expect(canWriteClinicalNotes('doctor')).toBe(true);
		expect(canWriteClinicalNotes('admin')).toBe(false);
	});

	it('allows appointment management UI only for staff roles that own actions', () => {
		expect(canManageAppointmentActions('admin')).toBe(true);
		expect(canManageAppointmentActions('secretary')).toBe(true);
		expect(canManageAppointmentActions('doctor')).toBe(true);
		expect(canManageAppointmentActions('patient')).toBe(false);
		expect(canManageAppointmentActions('writer')).toBe(false);
	});

	it('restricts cancel/reschedule by status', () => {
		expect(canCancelAppointmentStatus('reserved')).toBe(true);
		expect(canCancelAppointmentStatus('completed')).toBe(false);
		expect(canRescheduleAppointmentStatus('reserved')).toBe(true);
		expect(canRescheduleAppointmentStatus('cancelled')).toBe(false);
	});

	it('keeps desk and patients paths role-scoped', () => {
		expect(canAccessPath('/dashboard/desk', 'secretary')).toBe(true);
		expect(canAccessPath('/dashboard/desk', 'doctor')).toBe(false);
		expect(canAccessPath('/dashboard/patients', 'doctor')).toBe(true);
		expect(canAccessPath('/dashboard/patients', 'secretary')).toBe(false);
	});
});
