import { ClientResponseError } from 'pocketbase';
import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
import type { PatientReferralRow, PatientReferralStatus } from '../types';

function mapStatus(raw: string): PatientReferralStatus {
	const allowed: PatientReferralStatus[] = ['pending', 'accepted', 'completed', 'cancelled'];
	return allowed.includes(raw as PatientReferralStatus) ? (raw as PatientReferralStatus) : 'pending';
}

function parseRecordDate(value: unknown): string {
	if (value) return String(value);
	return new Date().toISOString();
}

function doctorDisplayName(
	exp?: { display_name?: string; expand?: { user?: { name?: string } } } | null
): string {
	return String(exp?.display_name || exp?.expand?.user?.name || 'متخصص');
}

export function referralStatusLabel(status: PatientReferralStatus): string {
	const map: Record<PatientReferralStatus, string> = {
		pending: 'در انتظار تأیید',
		accepted: 'پذیرفته‌شده',
		completed: 'تکمیل‌شده',
		cancelled: 'لغو‌شده'
	};
	return map[status];
}

export async function loadPatientReferrals(patientId: string): Promise<PatientReferralRow[]> {
	try {
		let res;
		try {
			res = await pb.collection('patient_referrals').getList(1, 50, {
				filter: `patient = "${patientId}"`,
				expand: 'from_doctor,to_doctor',
				sort: '-id',
				...PB_NO_AUTO_CANCEL
			});
		} catch {
			res = await pb.collection('patient_referrals').getList(1, 50, {
				filter: `patient = "${patientId}"`,
				sort: '-id',
				...PB_NO_AUTO_CANCEL
			});
		}

		const doctorIds = new Set<string>();
		for (const item of res.items) {
			if (item.from_doctor) doctorIds.add(String(item.from_doctor));
			if (item.to_doctor) doctorIds.add(String(item.to_doctor));
		}

		const doctorNames = new Map<string, string>();
		for (const item of res.items) {
			const expand = item.expand as
				| {
						from_doctor?: { id?: string; display_name?: string; expand?: { user?: { name?: string } } };
						to_doctor?: { id?: string; display_name?: string; expand?: { user?: { name?: string } } };
				  }
				| undefined;
			const fromId = String(item.from_doctor || '');
			const toId = String(item.to_doctor || '');
			if (fromId && expand?.from_doctor) {
				doctorNames.set(fromId, doctorDisplayName(expand.from_doctor));
			}
			if (toId && expand?.to_doctor) {
				doctorNames.set(toId, doctorDisplayName(expand.to_doctor));
			}
		}

		await Promise.all(
			[...doctorIds]
				.filter((id) => !doctorNames.has(id))
				.map(async (docId) => {
					try {
						const doc = await pb.collection('doctors').getOne(docId, {
							expand: 'user',
							...PB_NO_AUTO_CANCEL
						});
						const exp = doc.expand as { user?: { name?: string } } | undefined;
						doctorNames.set(docId, String(doc.display_name || exp?.user?.name || 'متخصص'));
					} catch {
						doctorNames.set(docId, 'متخصص');
					}
				})
		);

		return res.items.map((item) => {
			const fromId = String(item.from_doctor || '');
			const toId = String(item.to_doctor || '');
			return {
				id: item.id,
				fromDoctorId: fromId,
				toDoctorId: toId,
				fromDoctorName: doctorNames.get(fromId) || 'متخصص',
				toDoctorName: doctorNames.get(toId) || 'متخصص',
				reason: String(item.reason || ''),
				clinicalSummary: String(item.clinical_summary || ''),
				status: mapStatus(String(item.status || 'pending')),
				created: parseRecordDate(item.created)
			};
		});
	} catch {
		return [];
	}
}

export function formatReferralError(error: unknown): string {
	if (error instanceof ClientResponseError) {
		if (error.status === 403) return 'مجوز ثبت ارجاع ندارید.';
		if (error.status === 404) return 'سرویس ارجاع یافت نشد.';
		return error.message || 'خطا در ثبت ارجاع';
	}
	if (error instanceof Error) return error.message;
	return 'خطا در ثبت ارجاع';
}

async function referralFetch(
	method: 'POST' | 'PATCH' | 'DELETE',
	path: string,
	body?: Record<string, unknown>
): Promise<void> {
	const token = pb.authStore.token;
	if (!token) {
		throw new Error('نشست شما منقضی شده — صفحه را رفرش کنید و دوباره وارد شوید.');
	}

	const response = await fetch(`${pb.baseUrl}/api/collections/patient_referrals/records${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
			...(body ? { 'Content-Type': 'application/json' } : {})
		},
		...(body ? { body: JSON.stringify(body) } : {})
	});

	if (!response.ok) {
		let payload: { message?: string; data?: Record<string, unknown> } = {};
		try {
			payload = (await response.json()) as typeof payload;
		} catch {
			/* ignore */
		}
		throw new ClientResponseError({
			url: response.url,
			status: response.status,
			data: payload,
			message: payload.message || 'خطا در عملیات ارجاع'
		});
	}
}

export async function createPatientReferral(params: {
	patientId: string;
	fromDoctorId: string;
	toDoctorId: string;
	userId: string;
	reason: string;
	clinicalSummary?: string;
}): Promise<void> {
	await referralFetch('POST', '', {
		patient: params.patientId,
		from_doctor: params.fromDoctorId,
		to_doctor: params.toDoctorId,
		created_by: params.userId,
		reason: params.reason.trim(),
		clinical_summary: (params.clinicalSummary || '').trim(),
		status: 'pending'
	});
}

export async function updatePatientReferral(params: {
	id: string;
	toDoctorId: string;
	reason: string;
	clinicalSummary?: string;
}): Promise<void> {
	await referralFetch('PATCH', `/${params.id}`, {
		to_doctor: params.toDoctorId,
		reason: params.reason.trim(),
		clinical_summary: (params.clinicalSummary || '').trim()
	});
}

export async function acceptPatientReferral(id: string): Promise<void> {
	await referralFetch('PATCH', `/${id}`, { status: 'accepted' });
}

export async function deletePatientReferral(id: string): Promise<void> {
	await referralFetch('DELETE', `/${id}`);
}
