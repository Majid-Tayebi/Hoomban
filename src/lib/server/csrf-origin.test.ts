import { describe, expect, it } from 'vitest';
import { assertSameOrigin, isMutatingMethod, isOriginCheckExempt } from '$lib/server/csrf-origin';
import { timingSafeEqualString } from '$lib/server/security/timing-safe';

describe('csrf-origin', () => {
	it('accepts matching Origin', () => {
		const url = new URL('https://hoomban.ir/api/messages');
		const req = new Request(url, {
			method: 'POST',
			headers: { Origin: 'https://hoomban.ir' }
		});
		expect(assertSameOrigin(req, url).ok).toBe(true);
	});

	it('rejects mismatched Origin', () => {
		const url = new URL('https://hoomban.ir/api/messages');
		const req = new Request(url, {
			method: 'POST',
			headers: { Origin: 'https://evil.example' }
		});
		expect(assertSameOrigin(req, url).ok).toBe(false);
	});

	it('exempts cron and zarinpal callback paths', () => {
		expect(isOriginCheckExempt('/api/cron/appointment-reminders')).toBe(true);
		expect(isOriginCheckExempt('/api/payments/zarinpal/callback')).toBe(true);
		expect(isOriginCheckExempt('/api/desk/record-payment')).toBe(false);
	});

	it('detects mutating methods', () => {
		expect(isMutatingMethod('POST')).toBe(true);
		expect(isMutatingMethod('get')).toBe(false);
	});
});

describe('timingSafeEqualString', () => {
	it('matches equal secrets', () => {
		expect(timingSafeEqualString('secret-value', 'secret-value')).toBe(true);
	});

	it('rejects unequal secrets', () => {
		expect(timingSafeEqualString('secret-value', 'secret-valux')).toBe(false);
		expect(timingSafeEqualString('a', 'ab')).toBe(false);
	});
});
