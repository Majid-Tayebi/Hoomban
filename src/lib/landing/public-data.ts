import { pb } from '$lib/pocketbase';

export type LandingDoctor = {
	id: string;
	name: string;
	specialty: string;
	bio: string;
	visitFee: number;
	slotDuration: number;
	photo?: string;
	updated: string;
};

export type LandingService = {
	id: string;
	title: string;
	description: string;
	price: number;
	category: string;
};

export type LandingTestimonial = {
	id: string;
	author: string;
	source: string;
	body: string;
	rating?: number;
	doctorId?: string;
};

function mapLandingDoctor(item: Record<string, unknown>): LandingDoctor {
	const expand = item.expand as { user?: { name?: string } } | undefined;
	return {
		id: String(item.id),
		name: String(item.display_name || expand?.user?.name || 'متخصص'),
		specialty: String(item.specialty || 'روانشناس'),
		bio: String(item.bio || ''),
		visitFee: Number(item.visit_fee || 0),
		slotDuration: Number(item.slot_duration || 45),
		photo: item.photo ? String(item.photo) : undefined,
		updated: String(item.updated || item.created || '')
	};
}

/** نام پیش‌فرض برجسته در اسلاید متخصصین لندینگ */
export const DEFAULT_LANDING_DOCTOR_NAME = 'محمدرضا خوانساری';

export function resolveDefaultLandingDoctorId(
	doctors: { id: string; name: string }[]
): string | null {
	if (!doctors.length) return null;
	const preferred = doctors.find((d) =>
		d.name.replace(/\s+/g, ' ').trim().includes(DEFAULT_LANDING_DOCTOR_NAME)
	);
	return preferred?.id ?? doctors[0].id;
}

export function getLandingDoctorPhotoUrl(
	doctor: Pick<LandingDoctor, 'id' | 'photo' | 'updated'>
): string | null {
	if (!doctor.photo) return null;
	const base = pb.files.getURL(
		{ id: doctor.id, collectionName: 'doctors' } as never,
		doctor.photo
	);
	return doctor.updated ? `${base}?v=${encodeURIComponent(doctor.updated)}` : base;
}

export async function loadLandingPublicData(): Promise<{
	doctors: LandingDoctor[];
	services: LandingService[];
	testimonials: LandingTestimonial[];
}> {
	// همه متخصصین فعال — تعداد کارت‌ها = تعداد رکوردهای دیتابیس
	// فیلتر دقیق‌تر نمایش در سایت (مثلاً show_on_landing) بعداً از پنل اضافه می‌شود
	const [doctorItems, servicesResult, testimonialsResult] = await Promise.all([
		pb.collection('doctors').getFullList({
			filter: 'is_active = true',
			sort: 'sort_order',
			expand: 'user'
		}),
		pb.collection('services').getList(1, 20, {
			filter: 'is_active = true && price > 0',
			sort: 'sort_order'
		}),
		pb.collection('testimonials').getList(1, 50, {
			filter: 'is_published = true',
			sort: 'sort_order',
			expand: 'doctor'
		})
	]);

	return {
		doctors: doctorItems.map((item) =>
			mapLandingDoctor(item as unknown as Record<string, unknown>)
		),
		services: servicesResult.items.map((item) => ({
			id: item.id,
			title: String(item.title || ''),
			description: String(item.description || ''),
			price: Number(item.price || 0),
			category: String(item.category || '')
		})),
		testimonials: testimonialsResult.items.map((item) => {
			const expand = item.expand as { doctor?: string } | undefined;
			const doctorField = item.doctor;
			const doctorId =
				typeof doctorField === 'string'
					? doctorField
					: doctorField && typeof doctorField === 'object' && 'id' in doctorField
						? String((doctorField as { id: string }).id)
						: expand?.doctor
							? String(expand.doctor)
							: undefined;
			return {
				id: item.id,
				author: String(item.author || ''),
				source: String(item.source || ''),
				body: String(item.body || ''),
				rating: item.rating != null ? Number(item.rating) : undefined,
				doctorId
			};
		})
	};
}
