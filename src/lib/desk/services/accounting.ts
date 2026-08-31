import { pb } from '$lib/pocketbase';
import { isServiceAppointment, parseServiceNote } from '$lib/appointments/service-booking';
import type {
	AccountingSummary,
	LedgerRow,
	PatientDeskAccounting,
	PaymentMethod,
	PaymentStatus
} from '../types';

type RawAppointment = {
	id: string;
	date_time?: string;
	status?: string;
	type?: string;
	notes_public?: string;
	expand?: {
		doctor?: { display_name?: string; visit_fee?: number; expand?: { user?: { name?: string } } };
	};
};

function deriveStatus(expected: number, paid: number, stored?: string): PaymentStatus {
	if (stored === 'waived') return 'waived';
	if (paid <= 0) return 'unpaid';
	if (paid >= expected) return 'paid';
	return 'partial';
}

function appointmentTitle(apt: RawAppointment): string {
	const notesPublic = apt.notes_public ? String(apt.notes_public) : '';
	const serviceInfo = parseServiceNote(notesPublic);
	if (isServiceAppointment(String(apt.type || ''), notesPublic) && serviceInfo) {
		return serviceInfo.title;
	}
	const exp = apt.expand?.doctor;
	return String(exp?.display_name || exp?.expand?.user?.name || 'ویزیت متخصص');
}

function expectedFee(
	apt: RawAppointment,
	servicePrices: Map<string, number>
): number {
	const notesPublic = apt.notes_public ? String(apt.notes_public) : '';
	const serviceInfo = parseServiceNote(notesPublic);
	if (isServiceAppointment(String(apt.type || ''), notesPublic) && serviceInfo) {
		return servicePrices.get(serviceInfo.title.trim()) ?? 0;
	}
	return Number(apt.expand?.doctor?.visit_fee || 0);
}

async function loadServicePrices(): Promise<Map<string, number>> {
	try {
		const res = await pb.collection('services').getList(1, 100, {
			filter: 'is_active = true'
		});
		return new Map(
			res.items.map((s) => [String(s.title || '').trim(), Number(s.price || 0)])
		);
	} catch {
		return new Map();
	}
}

function resolveAppointmentAmounts(
	apt: RawAppointment,
	tx: Record<string, unknown> | undefined,
	servicePrices: Map<string, number>
) {
	const baseExpected = expectedFee(apt, servicePrices);
	const expected = tx ? Number(tx.expected_amount ?? baseExpected) : baseExpected;
	const paid = tx ? Number(tx.paid_amount || 0) : 0;
	const status = deriveStatus(expected, paid, tx ? String(tx.status) : undefined);
	const remaining = status === 'waived' ? 0 : Math.max(0, expected - paid);

	return { expected, paid, status, remaining };
}

function buildSummary(ledger: LedgerRow[]): AccountingSummary {
	const active = ledger.filter((row) => row.status !== 'waived');
	const totalExpected = active.reduce((sum, row) => sum + row.expectedAmount, 0);
	const totalPaid = active.reduce((sum, row) => sum + row.paidAmount, 0);
	const unpaidCount = active.filter((row) => row.status === 'unpaid' || row.status === 'partial').length;

	return {
		totalExpected,
		totalPaid,
		balance: Math.max(0, totalExpected - totalPaid),
		unpaidCount
	};
}

const txReadOptions = { $autoCancel: false as const };

function sortTransactionsNewestFirst(items: Record<string, unknown>[]): Record<string, unknown>[] {
	return [...items].sort(
		(a, b) => new Date(String(b.created || 0)).getTime() - new Date(String(a.created || 0)).getTime()
	);
}

/** PocketBase rejects `sort: '-created'` on this collection — fetch then sort client-side. */
async function fetchTransactions(options?: {
	patientUserId?: string;
	limit?: number;
}): Promise<Record<string, unknown>[]> {
	const filter = options?.patientUserId
		? `patient = "${options.patientUserId}"`
		: 'patient != ""';

	const res = await pb.collection('transactions').getList(1, options?.limit ?? 500, {
		filter,
		...txReadOptions
	});

	return sortTransactionsNewestFirst(res.items as Record<string, unknown>[]);
}

export async function loadPatientAccounting(patientUserId: string): Promise<PatientDeskAccounting> {
	if (patientUserId.length < 5 || patientUserId.startsWith('demo-')) {
		return buildDemoAccounting();
	}

	const [aptRes, servicePrices] = await Promise.all([
		pb.collection('appointments').getList(1, 100, {
			filter: `patient = "${patientUserId}" && status != "cancelled"`,
			expand: 'doctor,doctor.user',
			sort: '-date_time',
			...txReadOptions
		}),
		loadServicePrices()
	]);

	let txItems: Record<string, unknown>[] = [];
	try {
		txItems = await fetchTransactions({ patientUserId, limit: 100 });
	} catch {
		txItems = [];
	}

	const txByAppointment = new Map<string, Record<string, unknown>>();
	const standaloneTx: Record<string, unknown>[] = [];

	for (const tx of txItems) {
		const aptId = tx.appointment ? String(tx.appointment) : '';
		if (aptId) {
			if (!txByAppointment.has(aptId)) txByAppointment.set(aptId, tx);
		} else {
			standaloneTx.push(tx);
		}
	}

	const ledgerFromAppointments: LedgerRow[] = (aptRes.items as RawAppointment[]).map((apt) => {
		const tx = txByAppointment.get(apt.id);
		const { expected, paid, status } = resolveAppointmentAmounts(apt, tx, servicePrices);

		return {
			id: apt.id,
			appointmentId: apt.id,
			title: appointmentTitle(apt),
			date: new Date(String(apt.date_time)),
			expectedAmount: tx ? Number(tx.expected_amount ?? expected) : expected,
			paidAmount: paid,
			status,
			method: tx?.method ? (String(tx.method) as PaymentMethod) : undefined,
			paidAt: tx?.paid_at ? new Date(String(tx.paid_at)) : undefined,
			notes: tx?.notes ? String(tx.notes) : undefined,
			transactionId: tx ? String(tx.id) : undefined
		};
	});

	const ledgerFromStandalone: LedgerRow[] = standaloneTx.map((tx) => {
		const expected = Number(tx.expected_amount || 0);
		const paid = Number(tx.paid_amount || 0);
		return {
			id: String(tx.id),
			title: String(tx.title || 'هزینه'),
			date: tx.paid_at ? new Date(String(tx.paid_at)) : new Date(String(tx.created)),
			expectedAmount: expected,
			paidAmount: paid,
			status: deriveStatus(expected, paid, String(tx.status)),
			method: tx.method ? (String(tx.method) as PaymentMethod) : undefined,
			paidAt: tx.paid_at ? new Date(String(tx.paid_at)) : undefined,
			notes: tx.notes ? String(tx.notes) : undefined,
			transactionId: String(tx.id)
		};
	});

	const ledger = [...ledgerFromAppointments, ...ledgerFromStandalone].sort(
		(a, b) => b.date.getTime() - a.date.getTime()
	);

	return { ledger, summary: buildSummary(ledger) };
}

export function applyPaymentToAccounting(
	accounting: PatientDeskAccounting,
	row: LedgerRow,
	saved: { transactionId: string; status: PaymentStatus; paidAmount: number },
	method?: PaymentMethod,
	notes?: string
): PatientDeskAccounting {
	const ledger = accounting.ledger.map((item) => {
		const matches =
			item.id === row.id || (row.appointmentId != null && item.appointmentId === row.appointmentId);
		if (!matches) return item;

		return {
			...item,
			paidAmount: saved.paidAmount,
			status: saved.status,
			transactionId: saved.transactionId,
			method: saved.paidAmount > 0 ? method : item.method,
			notes: notes || item.notes,
			paidAt: saved.paidAmount > 0 ? new Date() : item.paidAt
		};
	});

	return { ledger, summary: buildSummary(ledger) };
}

export async function recordPayment(params: {
	patientUserId: string;
	appointmentId?: string;
	title: string;
	expectedAmount: number;
	paidAmount: number;
	method?: PaymentMethod;
	notes?: string;
	userId: string;
	transactionId?: string;
	statusOverride?: PaymentStatus;
}): Promise<{ transactionId: string; status: PaymentStatus; paidAmount: number }> {
	if (!pb.authStore.token) {
		throw new Error('لطفاً دوباره وارد شوید');
	}

	const res = await fetch('/api/desk/record-payment', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${pb.authStore.token}`
		},
		body: JSON.stringify(params)
	});

	const data = (await res.json()) as {
		error?: string;
		transactionId?: string;
		status?: PaymentStatus;
		paidAmount?: number;
	};

	if (!res.ok) {
		throw new Error(data.error || 'ثبت پرداخت ناموفق بود');
	}

	return {
		transactionId: String(data.transactionId),
		status: data.status as PaymentStatus,
		paidAmount: Number(data.paidAmount ?? 0)
	};
}

export async function markWaived(params: {
	patientUserId: string;
	appointmentId?: string;
	title: string;
	expectedAmount: number;
	userId: string;
	transactionId?: string;
	notes?: string;
}): Promise<{ transactionId: string; status: PaymentStatus; paidAmount: number }> {
	return recordPayment({
		...params,
		paidAmount: 0,
		notes: params.notes || 'بخشودگی توسط منشی',
		statusOverride: 'waived'
	});
}

function buildDemoAccounting(): PatientDeskAccounting {
	const ledger: LedgerRow[] = [
		{
			id: 'demo-1',
			appointmentId: '1',
			title: 'ویزیت دکتر احمدی',
			date: new Date(Date.now() - 86400000 * 3),
			expectedAmount: 850_000,
			paidAmount: 850_000,
			status: 'paid',
			method: 'card',
			paidAt: new Date(Date.now() - 86400000 * 3)
		},
		{
			id: 'demo-2',
			appointmentId: '2',
			title: 'نقشه مغزی',
			date: new Date(Date.now() + 86400000),
			expectedAmount: 1_200_000,
			paidAmount: 0,
			status: 'unpaid'
		}
	];
	return { ledger, summary: buildSummary(ledger) };
}

/** Sum recorded payments, optionally limited to a date range (uses paid_at, then created). */
export async function fetchPaymentsTotal(range?: { from: Date; to: Date }): Promise<number> {
	try {
		const items = await pb.collection('transactions').getFullList({
			filter: 'paid_amount > 0',
			fields: 'paid_amount,paid_at,created,status',
			...txReadOptions
		});

		return items.reduce((sum, tx) => {
			if (String(tx.status) === 'waived') return sum;
			const paid = Number(tx.paid_amount || 0);
			if (paid <= 0) return sum;

			if (range) {
				const raw = tx.paid_at || tx.created;
				if (!raw) return sum;
				const at = new Date(String(raw));
				if (Number.isNaN(at.getTime())) return sum;
				if (at < range.from || at >= range.to) return sum;
			}

			return sum + paid;
		}, 0);
	} catch {
		return 0;
	}
}

export async function loadDeskAccountingOverview(): Promise<
	import('../types').DeskAccountingOverview
> {
	const [aptRes, servicePrices] = await Promise.all([
		pb.collection('appointments').getList(1, 200, {
			filter: 'status != "cancelled"',
			expand: 'patient,doctor,doctor.user',
			sort: '-date_time',
			...txReadOptions
		}),
		loadServicePrices()
	]);

	let txItems: Record<string, unknown>[] = [];
	try {
		txItems = await fetchTransactions({ limit: 500 });
	} catch {
		txItems = [];
	}

	const byPatient = new Map<
		string,
		{ name: string; phone: string; created?: string; appointments: RawAppointment[] }
	>();

	for (const apt of aptRes.items as RawAppointment[]) {
		const exp = apt as RawAppointment & {
			patient?: string;
			expand?: { patient?: { id?: string; name?: string; mobile?: string; created?: string } };
		};
		const patientId = String(exp.patient || exp.expand?.patient?.id || '');
		if (!patientId) continue;

		const entry = byPatient.get(patientId) ?? {
			name: String(exp.expand?.patient?.name || 'مراجع'),
			phone: String(exp.expand?.patient?.mobile || '—'),
			created: exp.expand?.patient?.created,
			appointments: []
		};
		entry.appointments.push(apt);
		byPatient.set(patientId, entry);
	}

	const txByPatient = new Map<string, Record<string, unknown>[]>();
	for (const tx of txItems) {
		const pid = String(tx.patient || '');
		if (!pid) continue;
		const list = txByPatient.get(pid) ?? [];
		list.push(tx);
		byPatient.set(pid, byPatient.get(pid) ?? {
			name: 'مراجع',
			phone: '—',
			appointments: []
		});
		txByPatient.set(pid, list);
	}

	const { formatPatientCodeFromUser } = await import('$lib/patients/patient-code');

	const patients = [...byPatient.entries()].map(([id, info]) => {
		const txByAppointment = new Map<string, Record<string, unknown>>();
		for (const tx of sortTransactionsNewestFirst(txByPatient.get(id) ?? [])) {
			const aptId = tx.appointment ? String(tx.appointment) : '';
			if (aptId && !txByAppointment.has(aptId)) txByAppointment.set(aptId, tx);
		}

		let balance = 0;
		let unpaidCount = 0;

		for (const apt of info.appointments) {
			const tx = txByAppointment.get(apt.id);
			const { status, remaining } = resolveAppointmentAmounts(apt, tx, servicePrices);
			if (status === 'waived') continue;
			balance += remaining;
			if (status === 'unpaid' || status === 'partial') unpaidCount += 1;
		}

		const sorted = [...info.appointments].sort(
			(a, b) => new Date(String(b.date_time)).getTime() - new Date(String(a.date_time)).getTime()
		);

		return {
			id,
			name: info.name.replaceAll('بیمار', 'مراجع').trim() || 'مراجع',
			patientCode: formatPatientCodeFromUser(id, info.created ?? null),
			phone: info.phone,
			balance,
			unpaidCount,
			lastVisit: sorted[0] ? new Date(String(sorted[0].date_time)) : undefined
		};
	});

	const totalPaid = txItems.reduce((sum, tx) => sum + Number(tx.paid_amount || 0), 0);

	return {
		patients,
		totals: {
			patientCount: patients.length,
			totalBalance: patients.reduce((sum, row) => sum + row.balance, 0),
			totalUnpaidItems: patients.reduce((sum, row) => sum + row.unpaidCount, 0),
			totalPaid
		}
	};
}
