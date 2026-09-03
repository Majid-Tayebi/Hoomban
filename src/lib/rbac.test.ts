import { describe, expect, it } from 'vitest';
import {
	canAccessPatientRecord,
	canAccessPath,
	canAccessSecretaryPatientDesk,
	canViewClinicalNotes,
	canViewPsychTestsDashboard
} from '$lib/rbac';

describe('rbac', () => {
	it('denies secretary from patient record routes', () => {
		expect(canAccessPatientRecord('secretary')).toBe(false);
		expect(canAccessPath('/dashboard/patients', 'secretary')).toBe(false);
		expect(canAccessPath('/dashboard/patients/abc', 'secretary')).toBe(false);
	});

	it('allows doctor and admin to patient records', () => {
		expect(canAccessPatientRecord('doctor')).toBe(true);
		expect(canAccessPatientRecord('admin')).toBe(true);
		expect(canAccessPath('/dashboard/patients', 'doctor')).toBe(true);
	});

	it('allows secretary desk but not clinical notes', () => {
		expect(canAccessSecretaryPatientDesk('secretary')).toBe(true);
		expect(canAccessPath('/dashboard/desk/patients/x', 'secretary')).toBe(true);
		expect(canViewClinicalNotes('secretary')).toBe(false);
	});

	it('restricts psych test dashboard to writer and admin', () => {
		expect(canViewPsychTestsDashboard('writer')).toBe(true);
		expect(canViewPsychTestsDashboard('admin')).toBe(true);
		expect(canViewPsychTestsDashboard('doctor')).toBe(false);
	});

	it('denies unknown dashboard paths by default', () => {
		expect(canAccessPath('/dashboard/unknown-module', 'admin')).toBe(false);
	});
});
