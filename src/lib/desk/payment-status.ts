import type { PaymentStatus } from './types';

export function computeRemaining(expected: number, paid: number, waived: number): number {
	return Math.max(0, expected - Math.max(0, paid) - Math.max(0, waived));
}

export function derivePaymentStatus(
	expected: number,
	paid: number,
	waived: number,
	stored?: string
): PaymentStatus {
	const expectedAmt = Math.max(0, expected);
	const paidAmt = Math.max(0, paid);
	let waivedAmt = Math.max(0, waived);

	if (stored === 'waived' && waivedAmt <= 0) {
		waivedAmt = Math.max(0, expectedAmt - paidAmt);
	}

	const remaining = computeRemaining(expectedAmt, paidAmt, waivedAmt);

	if (remaining <= 0) {
		if (paidAmt <= 0 && waivedAmt >= expectedAmt) return 'waived';
		return 'paid';
	}

	if (paidAmt > 0 || waivedAmt > 0) return 'partial';
	return 'unpaid';
}
