const amountFormatter = new Intl.NumberFormat('en-US', {
	maximumFractionDigits: 0
});

/** Format numeric amounts with comma thousands separators (e.g. 450,000). */
export function formatAmount(amount: number | null | undefined): string {
	const n = Math.round(Number(amount) || 0);
	return amountFormatter.format(n);
}

export function formatToman(amount: number | null | undefined): string {
	return `${formatAmount(amount)} تومان`;
}

export function parseAmount(value: string | number | null | undefined): number {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? Math.round(value) : 0;
	}
	return Number(String(value ?? '').replace(/[^\d]/g, '')) || 0;
}
