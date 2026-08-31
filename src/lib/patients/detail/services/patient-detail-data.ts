import { ClientResponseError } from 'pocketbase';
import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
import type { AuthUser } from '$lib/auth.svelte';
import type {
	ClinicalNoteRow,
	MedicationItem,
	PatientAppointmentRow,
	PatientDetailData,
	PatientDetailProfile,
	PatientMetaField
} from '../types';
import {
	MOCK_REPORTS
} from '../data/mock-data';
import { parsePatientHealthFromProfile } from './patient-health';
import { formatPatientCodeFromUser } from '../../patient-code';
import { isServiceAppointment, parseServiceNote } from '$lib/appointments/service-booking';
import { loadPatientAttachments } from './patient-attachments';
import { loadPatientReferrals } from './patient-referrals';
import { userAvatarUrl } from '$lib/profile/services/profile-data';
import { toIsoDateString } from '$lib/date';

type DetailUser = NonNullable<AuthUser>;

/** Display label: never show «بیمار» in client-facing UI. */
function clientDisplayName(name: string): string {
	return name.replaceAll('بیمار', 'مراجع').trim() || 'مراجع';
}

function formatTimeRange(d: Date): string {
	const start = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
	const endDate = new Date(d.getTime() + 45 * 60 * 1000);
	const end = endDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
	return `${start} – ${end}`;
}

function mapType(type: string, isService: boolean): string {
	if (isService) return 'خدمت';
	return type === 'online' ? 'آنلاین' : 'حضوری';
}

function mapStatus(status: string): string {
	const map: Record<string, string> = {
		completed: 'تکمیل‌شده',
		cancelled: 'لغو‌شده',
		pending: 'در انتظار',
		reserved: 'رزرو',
		confirmed: 'تأیید‌شده'
	};
	return map[status] || status;
}

function pushMetaField(meta: PatientMetaField[], label: string, value: unknown) {
	const text = String(value ?? '').trim();
	if (text && text !== '—') meta.push({ label, value: text });
}

function formatBirthDate(value: unknown): string {
	if (!value) return '';
	const date = new Date(String(value));
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString('fa-IR');
}

function ageFromBirthDate(value: unknown): string {
	if (!value) return '';
	const date = new Date(String(value));
	if (Number.isNaN(date.getTime())) return '';
	const now = new Date();
	let age = now.getFullYear() - date.getFullYear();
	const monthDiff = now.getMonth() - date.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) age -= 1;
	if (age < 0) return '';
	return age.toLocaleString('fa-IR');
}

function buildPatientEnteredMeta(
	u: Record<string, unknown>,
	profile: PatientDetailProfile
): PatientMetaField[] {
	const meta: PatientMetaField[] = [];
	const birthDate = u.birth_date || profile.birthDate;

	pushMetaField(meta, 'کد ملی', profile.nationalId);
	pushMetaField(meta, 'نام کاربری', u.username ? `@${String(u.username).replace(/^@+/, '')}` : '');

	const birthLabel = formatBirthDate(birthDate);
	if (birthLabel) pushMetaField(meta, 'تاریخ تولد', birthLabel);

	const age = ageFromBirthDate(birthDate);
	if (age) pushMetaField(meta, 'سن', `${age} سال`);

	pushMetaField(meta, 'استان', u.province);
	pushMetaField(meta, 'شهر', u.city);
	pushMetaField(meta, 'آدرس منزل', u.home_address || u.address);
	pushMetaField(meta, 'تلفن ثابت', u.landline);
	pushMetaField(meta, 'تماس اضطراری', profile.emergencyContact);

	return meta;
}

export async function loadPatientDetail(
	patientId: string,
	user: AuthUser,
	canNotes: boolean
): Promise<{ data: PatientDetailData; doctorRecordId: string | null }> {
	if (!user) throw new Error('User is required');

	if (user.id === 'demo-user' || patientId.length < 5) {
		return {
			doctorRecordId: null,
			data: buildDemoDetail(patientId)
		};
	}

	const u = await pb.collection('users').getOne(patientId, PB_NO_AUTO_CANCEL);
	const name = clientDisplayName(String(u.name || 'مراجع'));
	const mobile = String(u.mobile || '—');

	let profile: PatientDetailProfile = {
		summary: '',
		nationalId: '',
		emergencyContact: ''
	};
	let health = {
		vitals: [] as ReturnType<typeof parsePatientHealthFromProfile>['vitals'],
		conditions: [] as ReturnType<typeof parsePatientHealthFromProfile>['conditions'],
		allergies: [] as ReturnType<typeof parsePatientHealthFromProfile>['allergies'],
		medications: [] as ReturnType<typeof parsePatientHealthFromProfile>['medications'],
		vitalsChart: null as ReturnType<typeof parsePatientHealthFromProfile>['vitalsChart']
	};

	try {
		const pp = await pb.collection('patient_profiles').getFirstListItem(
			`user = "${patientId}"`,
			PB_NO_AUTO_CANCEL
		);
		profile = {
			id: pp.id,
			summary: String(pp.summary || ''),
			nationalId: String(pp.national_id || ''),
			emergencyContact: String(pp.emergency_contact || ''),
			birthDate: pp.birth_date ? String(pp.birth_date) : undefined
		};
		health = parsePatientHealthFromProfile(pp as unknown as Record<string, unknown>);
	} catch {
		/* no profile yet */
	}

	const aptRes = await pb.collection('appointments').getList(1, 50, {
		filter: `patient = "${patientId}"`,
		expand: 'doctor',
		sort: '-date_time',
		...PB_NO_AUTO_CANCEL
	});

	const appointments: PatientAppointmentRow[] = aptRes.items.map((a) => {
		const exp = a.expand as {
			doctor?: { display_name?: string; expand?: { user?: { name?: string } } };
		};
		const dateTime = new Date(String(a.date_time));
		const notesPublic = a.notes_public ? String(a.notes_public) : '';
		const aptType = String(a.type || '');
		const serviceInfo = parseServiceNote(notesPublic);
		const isService = isServiceAppointment(aptType, notesPublic);
		const doctorName = String(
			exp.doctor?.display_name || exp.doctor?.expand?.user?.name || 'متخصص'
		);

		if (isService && serviceInfo) {
			return {
				id: a.id,
				dateTime,
				timeRange: formatTimeRange(dateTime),
				type: mapType(aptType, true),
				kind: 'service' as const,
				displayName: serviceInfo.title,
				serviceName: serviceInfo.title,
				status: mapStatus(String(a.status)),
				note: serviceInfo.category || ''
			};
		}

		return {
			id: a.id,
			dateTime,
			timeRange: formatTimeRange(dateTime),
			type: mapType(aptType, false),
			kind: 'specialist' as const,
			displayName: doctorName,
			specialistName: doctorName,
			status: mapStatus(String(a.status)),
			note: notesPublic
		};
	});

	let doctorRecordId: string | null = null;
	if (user.role === 'doctor') {
		const docs = await pb.collection('doctors').getList(1, 1, {
			filter: `user = "${user.id}"`,
			...PB_NO_AUTO_CANCEL
		});
		doctorRecordId = docs.items[0]?.id ?? null;
	} else if (user.role === 'admin' && canNotes) {
		const docs = await pb.collection('doctors').getList(1, 1, {
			filter: 'is_active = true',
			sort: 'sort_order',
			...PB_NO_AUTO_CANCEL
		});
		doctorRecordId = docs.items[0]?.id ?? null;
	}

	let notes: ClinicalNoteRow[] = [];
	if (canNotes) {
		try {
			let noteRes;
			try {
				noteRes = await pb.collection('clinical_notes').getList(1, 50, {
					filter: `patient = "${patientId}"`,
					expand: 'doctor',
					sort: '-id',
					...PB_NO_AUTO_CANCEL
				});
			} catch {
				// Fallback when relation expand fails on this PB schema
				noteRes = await pb.collection('clinical_notes').getList(1, 50, {
					filter: `patient = "${patientId}"`,
					sort: '-id',
					...PB_NO_AUTO_CANCEL
				});
			}

			const doctorIds = [
				...new Set(noteRes.items.map((n) => String(n.doctor || '')).filter(Boolean))
			];
			const doctorNames = new Map<string, string>();

			for (const n of noteRes.items) {
				const exp = n.expand as
					| { doctor?: { display_name?: string; expand?: { user?: { name?: string } } } }
					| undefined;
				const docId = String(n.doctor || '');
				if (!docId || doctorNames.has(docId)) continue;
				const fromExpand = exp?.doctor?.display_name || exp?.doctor?.expand?.user?.name;
				if (fromExpand) doctorNames.set(docId, String(fromExpand));
			}

			await Promise.all(
				doctorIds
					.filter((id) => !doctorNames.has(id))
					.map(async (docId) => {
						try {
							const doc = await pb.collection('doctors').getOne(docId, {
								expand: 'user',
								...PB_NO_AUTO_CANCEL
							});
							const exp = doc.expand as { user?: { name?: string } } | undefined;
							doctorNames.set(
								docId,
								String(doc.display_name || exp?.user?.name || 'متخصص')
							);
						} catch {
							doctorNames.set(docId, 'متخصص');
						}
					})
			);

			notes = noteRes.items.map((n) => {
				const audioFiles = Array.isArray(n.audio)
					? n.audio.map(String)
					: n.audio
						? [String(n.audio)]
						: [];
				return {
					id: n.id,
					text: String(n.text || ''),
					treatmentPlan: String(n.treatment_plan || ''),
					sessionDate: n.session_date ? String(n.session_date) : undefined,
					audio: audioFiles,
					doctorName: doctorNames.get(String(n.doctor)) || 'متخصص'
				};
			});
		} catch {
			notes = [];
		}
	}

	const meta = buildPatientEnteredMeta(u as Record<string, unknown>, profile);
	const avatarUrl = userAvatarUrl(patientId, u.avatar, u.updated);

	let attachments = canNotes ? await loadPatientAttachments(patientId) : [];
	const referrals = canNotes ? await loadPatientReferrals(patientId) : [];

	return {
		doctorRecordId,
		data: {
			id: patientId,
			name,
			patientCode: formatPatientCodeFromUser(patientId, u.created ? String(u.created) : null),
			avatarUrl,
			contact: {
				phone: mobile,
				email: u.email ? String(u.email) : '',
				address: '',
				emergencyContact: profile.emergencyContact || ''
			},
			meta,
			vitals: health.vitals,
			reports: MOCK_REPORTS,
			conditions: health.conditions,
			allergies: health.allergies,
			medications: health.medications,
			vitalsChart: health.vitalsChart,
			appointments,
			profile,
			notes,
			referrals,
			attachments
		}
	};
}

function buildDemoDetail(patientId: string): PatientDetailData {
	return {
		id: patientId,
		name: 'علی رضایی',
		patientCode: 'P102426',
		contact: {
			phone: '09121234567',
			email: 'ali.rezaei@example.com',
			address: 'تهران، خیابان ولیعصر',
			emergencyContact: '09121111111'
		},
		meta: [],
		vitals: [],
		reports: [],
		conditions: [],
		allergies: [],
		medications: [],
		vitalsChart: null,
		appointments: [
			{
				id: '1',
				dateTime: new Date(Date.now() + 86400000),
				timeRange: '۰۹:۰۰ – ۱۰:۰۰',
				type: 'حضوری',
				kind: 'specialist',
				displayName: 'دکتر احمدی',
				specialistName: 'دکتر احمدی',
				status: 'زمان‌بندی‌شده',
				note: 'جلسه پیگیری اضطراب'
			},
			{
				id: '2',
				dateTime: new Date(Date.now() - 86400000),
				timeRange: '۱۴:۰۰ – ۱۴:۴۵',
				type: 'خدمت',
				kind: 'service',
				displayName: 'نقشه مغزی',
				serviceName: 'نقشه مغزی',
				status: 'تکمیل‌شده',
				note: 'نوروتراپی'
			}
		],
		profile: {
			summary: 'مراجع با شکایت اضطراب و اختلال خواب مراجعه کرده است.',
			nationalId: '0012345678',
			emergencyContact: '09121111111'
		},
		notes: [],
		referrals: [],
		attachments: []
	};
}

export async function savePatientProfile(
	patientId: string,
	profile: PatientDetailProfile
): Promise<string> {
	const payload = {
		user: patientId,
		summary: profile.summary,
		national_id: profile.nationalId,
		emergency_contact: profile.emergencyContact
	};
	if (profile.id) {
		await pb.collection('patient_profiles').update(profile.id, payload, PB_NO_AUTO_CANCEL);
		return profile.id;
	}
	const created = await pb.collection('patient_profiles').create(payload, PB_NO_AUTO_CANCEL);
	return created.id;
}

export function formatClinicalNoteError(error: unknown): string {
	if (error instanceof ClientResponseError) {
		const data = error.response?.data as
			| Record<string, { message?: string; code?: string } | string>
			| undefined;

		const audioError = data?.audio;
		if (audioError && typeof audioError === 'object') {
			if (audioError.code === 'validation_invalid_mime_type') {
				return 'فرمت فایل صوتی مجاز نیست. دوباره ضبط کنید یا مرورگر دیگری امتحان کنید.';
			}
			if (audioError.message) return audioError.message;
		}

		for (const value of Object.values(data ?? {})) {
			if (value && typeof value === 'object' && 'message' in value && value.message) {
				return String(value.message);
			}
		}

		if (error.status === 0) return 'اتصال به سرور برقرار نشد.';
		if (error.status === 403) return 'مجوز ثبت یادداشت ندارید.';
		if (error.status === 404) return 'سرویس یادداشت‌ها یافت نشد.';
		return error.message || 'خطا در ثبت یادداشت';
	}

	if (error instanceof Error) return error.message;
	return 'خطا در ثبت یادداشت';
}

function audioFileName(blob: Blob, index: number): string {
	const type = blob.type.toLowerCase();
	if (type.includes('ogg')) return `note-${Date.now()}-${index}.ogg`;
	if (type.includes('mp4') || type.includes('m4a')) return `note-${Date.now()}-${index}.m4a`;
	if (type.includes('wav')) return `note-${Date.now()}-${index}.wav`;
	return `note-${Date.now()}-${index}.webm`;
}

export async function createClinicalNote(params: {
	patientId: string;
	doctorId: string;
	userId: string;
	text: string;
	treatmentPlan: string;
	audio?: Blob | Blob[] | null;
	appointmentId?: string;
}): Promise<void> {
	const token = pb.authStore.token;
	if (!token) {
		throw new Error('نشست شما منقضی شده — صفحه را رفرش کنید و دوباره وارد شوید.');
	}

	const form = new FormData();
	form.append('patient', params.patientId);
	form.append('doctor', params.doctorId);
	form.append('created_by', params.userId);
	form.append('session_date', toIsoDateString(new Date()));
	form.append('text', params.text);
	form.append('treatment_plan', params.treatmentPlan);
	if (params.appointmentId) form.append('appointment', params.appointmentId);

	const audioFiles = params.audio
		? Array.isArray(params.audio)
			? params.audio
			: [params.audio]
		: [];
	audioFiles.forEach((blob, index) => {
		form.append('audio', blob, audioFileName(blob, index));
	});

	const response = await fetch(`${pb.baseUrl}/api/collections/clinical_notes/records`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: form
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
			message: payload.message || 'خطا در ثبت یادداشت'
		});
	}
}

export async function deleteClinicalNote(id: string): Promise<void> {
	await pb.collection('clinical_notes').delete(id, PB_NO_AUTO_CANCEL);
}

export async function resolveDoctorId(user: DetailUser, current: string | null): Promise<string | null> {
	if (current) return current;
	if (user.role === 'admin') {
		const docs = await pb.collection('doctors').getList(1, 1, PB_NO_AUTO_CANCEL);
		return docs.items[0]?.id ?? null;
	}
	return null;
}

export function getMedicationStatusConfig(status: MedicationItem['status']) {
	const map = {
		active: { label: 'فعال', class: 'bg-primary/15 text-primary' },
		completed: { label: 'تکمیل‌شده', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
		discontinued: { label: 'متوقف‌شده', class: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' }
	} as const;
	return map[status];
}
