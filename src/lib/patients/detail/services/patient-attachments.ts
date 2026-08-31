import { ClientResponseError } from 'pocketbase';
import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
import type { PatientAttachmentRow } from '../types';

const CATEGORY_LABELS: Record<PatientAttachmentRow['category'], string> = {
	photo: 'عکس',
	document: 'سند',
	prior_record: 'پرونده سابق'
};

export function attachmentCategoryLabel(category: PatientAttachmentRow['category']): string {
	return CATEGORY_LABELS[category] ?? category;
}

export function formatAttachmentUploadError(error: unknown): string {
	if (error instanceof ClientResponseError) {
		const data = error.response?.data as
			| Record<string, { message?: string; code?: string } | string>
			| undefined;

		const fileError = data?.file;
		if (fileError && typeof fileError === 'object') {
			if (fileError.code === 'validation_invalid_mime_type') {
				return 'فرمت فایل مجاز نیست. فقط JPEG، PNG، WebP، HEIC و PDF پذیرفته می‌شود.';
			}
			if (fileError.message) return fileError.message;
		}

		for (const value of Object.values(data ?? {})) {
			if (value && typeof value === 'object' && 'message' in value && value.message) {
				return String(value.message);
			}
		}

		if (error.status === 0) return 'اتصال به سرور برقرار نشد.';
		if (error.status === 403) return 'مجوز آپلود ندارید.';
		if (error.status === 404) return 'سرویس پیوست‌ها یافت نشد. PocketBase را بررسی کنید.';
		return error.message || 'خطا در آپلود فایل';
	}

	if (error instanceof Error) return error.message;
	return 'خطا در آپلود فایل';
}

export async function loadPatientAttachments(patientId: string): Promise<PatientAttachmentRow[]> {
	try {
		const res = await pb.collection('patient_attachments').getList(1, 100, {
			filter: `patient = "${patientId}"`,
			sort: '-id',
			...PB_NO_AUTO_CANCEL
		});

		return res.items.map((row) => {
			const file = row.file ? String(row.file) : '';
			const mime = file.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*';
			return {
				id: row.id,
				title: String(row.title || 'پیوست'),
				category: (String(row.category || 'document') as PatientAttachmentRow['category']) || 'document',
				notes: String(row.notes || ''),
				fileName: file,
				mimeType: mime,
				created: String(row.created || '')
			};
		});
	} catch {
		return [];
	}
}

export function getAttachmentFileUrl(attachmentId: string, fileName: string): string {
	return pb.files.getURL(
		{
			id: attachmentId,
			collectionId: 'pbc_patient_attachments',
			collectionName: 'patient_attachments'
		} as never,
		fileName
	);
}

export async function createPatientAttachment(params: {
	patientId: string;
	doctorId: string;
	userId: string;
	title: string;
	category: PatientAttachmentRow['category'];
	notes?: string;
	file: File;
}): Promise<void> {
	const token = pb.authStore.token;
	if (!token) {
		throw new Error('نشست شما منقضی شده — صفحه را رفرش کنید و دوباره وارد شوید.');
	}

	const form = new FormData();
	form.append('patient', params.patientId);
	form.append('doctor', params.doctorId);
	form.append('uploaded_by', params.userId);
	form.append('title', params.title.trim());
	form.append('category', params.category);
	if (params.notes?.trim()) form.append('notes', params.notes.trim());
	form.append('file', params.file, params.file.name);

	const response = await fetch(`${pb.baseUrl}/api/collections/patient_attachments/records`, {
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
			message: payload.message || 'خطا در آپلود فایل'
		});
	}
}

export async function deletePatientAttachment(id: string): Promise<void> {
	await pb.collection('patient_attachments').delete(id, PB_NO_AUTO_CANCEL);
}
