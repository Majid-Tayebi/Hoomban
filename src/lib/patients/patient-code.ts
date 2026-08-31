/**
 * شماره پرونده مراجع: P + شماره ترتیبی (۴ رقم) + دو رقم سال ثبت‌نام
 * مثال: P102426 → شماره 1024، سال ۱۴۰۴/۲۰۲۶
 */
export function formatPatientFileNumber(
	sequential: number,
	registeredAt: Date | string | null | undefined
): string {
	const seq = String(Math.max(0, Math.floor(sequential))).padStart(4, '0').slice(-4);
	const date = registeredAt ? new Date(registeredAt) : new Date();
	const yy = String(date.getFullYear()).slice(-2);
	return `P${seq}${yy}`;
}

/** ساخت کد از رکورد PocketBase یا شناسه داخلی */
export function formatPatientCodeFromUser(
	id: string,
	created?: string | Date | null,
	index?: number
): string {
	if (index != null && index >= 0) {
		return formatPatientFileNumber(index + 1, created);
	}
	const fromId = parseInt(id.replace(/\D/g, '').slice(-4), 10);
	const sequential = Number.isFinite(fromId) && fromId > 0 ? fromId : 1;
	return formatPatientFileNumber(sequential, created);
}
