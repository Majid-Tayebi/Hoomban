export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'waived';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

export interface LedgerRow {
	id: string;
	appointmentId?: string;
	title: string;
	date: Date;
	expectedAmount: number;
	paidAmount: number;
	status: PaymentStatus;
	method?: PaymentMethod;
	paidAt?: Date;
	notes?: string;
	transactionId?: string;
}

export interface AccountingSummary {
	totalExpected: number;
	totalPaid: number;
	balance: number;
	unpaidCount: number;
}

export interface PatientDeskAccounting {
	ledger: LedgerRow[];
	summary: AccountingSummary;
}

export interface DeskPatientOverview {
	id: string;
	name: string;
	patientCode: string;
	phone: string;
	balance: number;
	unpaidCount: number;
	lastVisit?: Date;
}

export interface DeskAccountingTotals {
	patientCount: number;
	totalBalance: number;
	totalUnpaidItems: number;
	totalPaid: number;
}

export interface DeskAccountingOverview {
	patients: DeskPatientOverview[];
	totals: DeskAccountingTotals;
}

export interface PatientDeskData {
	id: string;
	name: string;
	patientCode: string;
	contact: {
		phone: string;
		email: string;
		emergencyContact: string;
	};
	meta: { label: string; value: string }[];
	appointments: import('$lib/patients/detail/types').PatientAppointmentRow[];
	accounting: PatientDeskAccounting;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
	paid: 'پرداخت‌شده',
	unpaid: 'پرداخت‌نشده',
	partial: 'پرداخت جزئی',
	waived: 'بخشوده'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
	cash: 'نقد',
	card: 'کارت',
	transfer: 'انتقال',
	other: 'سایر'
};

export { formatAmount, formatToman, parseAmount } from '$lib/money';

export function paymentStatusClass(status: PaymentStatus): string {
	const map: Record<PaymentStatus, string> = {
		paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
		unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
		partial: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
		waived: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
	};
	return map[status];
}
