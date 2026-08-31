import type { LedgerRow } from './types';
import { computeRemaining } from './payment-status';

export function ledgerRowRemaining(row: LedgerRow): number {
	return computeRemaining(row.expectedAmount, row.paidAmount, row.waivedAmount);
}

export function isLedgerSettled(row: LedgerRow): boolean {
	if (row.status === 'waived') return true;
	return ledgerRowRemaining(row) <= 0;
}

export function isOnlineGatewayPayment(row: LedgerRow): boolean {
	return row.method === 'gateway' && row.paidAmount > 0;
}
