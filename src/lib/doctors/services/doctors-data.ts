import { pb } from '$lib/pocketbase';
import type { AuthUser } from '$lib/auth.svelte';
import type {
	DoctorCardItem,
	DoctorEditForm,
	DoctorFilters,
	DoctorsPageData
} from '../types';
import { DEFAULT_SPECIALTIES, MOCK_DOCTORS } from '../data/mock-data';
import { WEEKDAYS_FA } from '$lib/date';
import { formatSlotsLabel, resolveDaySlots } from '$lib/schedule/working-schedule';

type WorkingDay = {
	day?: string;
	enabled?: boolean;
	startTime?: string;
	endTime?: string;
	slots?: { startTime: string; endTime: string }[];
};

function formatWorkingHours(workingDays: WorkingDay[]): string {
	const enabled = workingDays.filter((w) => w.enabled && resolveDaySlots(w).length);
	if (!enabled.length) return 'ساعات کاری ثبت نشده';

	const first = enabled[0];
	const last = enabled[enabled.length - 1];
	const dayRange =
		enabled.length === 1
			? first.day || ''
			: `${first.day || ''} تا ${last.day || ''}`;

	const slots = resolveDaySlots(first);
	return `${dayRange} (${formatSlotsLabel(slots)})`;
}

function mapDoctor(d: Record<string, unknown>): DoctorCardItem {
	const exp = d.expand as { user?: { name?: string; mobile?: string } } | undefined;
	const isActive = d.is_active !== false;
	const workingDays = Array.isArray(d.working_days) ? (d.working_days as WorkingDay[]) : [];
	const mobile = exp?.user?.mobile ? String(exp.user.mobile) : undefined;

	return {
		id: String(d.id),
		displayName: String(d.display_name || exp?.user?.name || 'متخصص'),
		specialty: String(d.specialty || 'روانشناسی'),
		visitFee: Number(d.visit_fee || 0),
		slotDuration: Number(d.slot_duration || 45),
		bio: String(d.bio || ''),
		isActive,
		availability: isActive ? 'available' : 'unavailable',
		photo: d.photo ? String(d.photo) : undefined,
		user: d.user ? String(d.user) : undefined,
		mobile,
		workingHours: formatWorkingHours(workingDays),
		location: 'کلینیک هومبان'
	};
}

export function getDoctorPhotoUrl(doctor: DoctorCardItem): string | null {
	if (!doctor.photo) return null;
	return pb.files.getURL(
		{ id: doctor.id, collectionId: 'pbc_656799828', collectionName: 'doctors' } as never,
		doctor.photo
	);
}

export async function loadDoctorsPageData(_user: AuthUser): Promise<DoctorsPageData> {
	try {
		const res = await pb.collection('doctors').getList(1, 100, {
			expand: 'user',
			sort: 'sort_order'
		});

		if (!res.items.length) {
			return { doctors: MOCK_DOCTORS, specialties: [...DEFAULT_SPECIALTIES] };
		}

		const doctors = res.items.map((d) => mapDoctor(d as unknown as Record<string, unknown>));
		const fromData = [...new Set(doctors.map((d) => d.specialty).filter(Boolean))];
		const specialties = ['همه', ...fromData.filter((s) => s !== 'همه')];

		return { doctors, specialties };
	} catch {
		return { doctors: MOCK_DOCTORS, specialties: [...DEFAULT_SPECIALTIES] };
	}
}

export function filterDoctors(doctors: DoctorCardItem[], filters: DoctorFilters): DoctorCardItem[] {
	return doctors.filter((d) => {
		const q = filters.query.trim();
		if (q) {
			const hit =
				d.displayName.includes(q) ||
				d.specialty.includes(q) ||
				(d.location || '').includes(q);
			if (!hit) return false;
		}
		if (filters.status !== 'all' && d.availability !== filters.status) return false;
		if (filters.specialty !== 'همه' && filters.specialty !== 'all' && d.specialty !== filters.specialty) {
			return false;
		}
		return true;
	});
}

export async function saveDoctor(
	form: DoctorEditForm,
	photoFile: File | null
): Promise<{ ok: true } | { ok: false; message: string }> {
	if (!form.id) {
		return {
			ok: false,
			message:
				'برای متخصص جدید ابتدا کاربر با نقش doctor بسازید و از پنل ادمین PocketBase ارتباط دهید.'
		};
	}

	const data = new FormData();
	data.append('display_name', form.displayName);
	data.append('specialty', form.specialty);
	data.append('visit_fee', String(form.visitFee));
	data.append('slot_duration', String(form.slotDuration));
	data.append('bio', form.bio);
	data.append('is_active', form.isActive ? 'true' : 'false');
	if (photoFile) data.append('photo', photoFile);

	await pb.collection('doctors').update(form.id, data);
	return { ok: true };
}

export function toEditForm(d: DoctorCardItem): DoctorEditForm {
	return {
		id: d.id,
		displayName: d.displayName,
		specialty: d.specialty,
		visitFee: d.visitFee,
		slotDuration: d.slotDuration,
		bio: d.bio,
		isActive: d.isActive
	};
}

/** Placeholder to keep WEEKDAYS import useful if we expand schedule UI later */
export const DOCTOR_WEEKDAYS = WEEKDAYS_FA;
