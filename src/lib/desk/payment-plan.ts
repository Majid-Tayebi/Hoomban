export type PaymentMode = 'full' | 'installment' | 'waived';

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
	full: 'تسویه کامل',
	installment: 'تقسیط',
	waived: 'بخشودگی'
};

import { formatAmount, parseAmount } from '$lib/money';

export function parseAmountInput(value: string | number): number {
	return parseAmount(value);
}

export type InstallmentPreview = {
	remainingDue: number;
	firstInstallment: number;
	leftAfterFirst: number;
	installmentCount: 2 | 3;
	remainingInstallments: number;
	suggestedPerInstallment: number;
};

export function computeInstallmentPreview(
	remainingDue: number,
	firstInstallment: number,
	installmentCount: 2 | 3
): InstallmentPreview | null {
	if (remainingDue <= 0 || firstInstallment <= 0) return null;

	const leftAfterFirst = Math.max(0, remainingDue - firstInstallment);
	const remainingInstallments = installmentCount - 1;
	const suggestedPerInstallment =
		remainingInstallments > 0 ? Math.ceil(leftAfterFirst / remainingInstallments) : 0;

	return {
		remainingDue,
		firstInstallment,
		leftAfterFirst,
		installmentCount,
		remainingInstallments,
		suggestedPerInstallment
	};
}

export function buildPaymentNotes(params: {
	userNotes?: string;
	paymentMode: PaymentMode;
	installmentCount?: 2 | 3;
	installmentPaidThis?: number;
	remainingAfter?: number;
	waivedAmount?: number;
	remainingAfterWaiver?: number;
}): string {
	const parts: string[] = [];

	if (params.paymentMode === 'installment' && params.installmentCount) {
		parts.push(
			`تقسیط ${params.installmentCount.toLocaleString('fa-IR')} قسطه` +
				(params.installmentPaidThis
					? ` — دریافت این مرحله: ${formatAmount(params.installmentPaidThis)} تومان`
					: '') +
				(params.remainingAfter !== undefined
					? ` — باقیمانده: ${formatAmount(params.remainingAfter)} تومان`
					: '')
		);
	} else if (params.paymentMode === 'full') {
		parts.push('تسویه کامل');
	} else if (params.paymentMode === 'waived') {
		if (params.waivedAmount !== undefined) {
			parts.push(`بخشودگی: ${formatAmount(params.waivedAmount)} تومان`);
			if (params.remainingAfterWaiver !== undefined && params.remainingAfterWaiver > 0) {
				parts.push(`مانده پس از بخشودگی: ${formatAmount(params.remainingAfterWaiver)} تومان`);
			}
		} else {
			parts.push('بخشودگی');
		}
	}

	if (params.userNotes?.trim()) parts.push(params.userNotes.trim());

	return parts.join(' | ');
}
