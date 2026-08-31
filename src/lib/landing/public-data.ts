import { pb } from '$lib/pocketbase';
import { LANDING_ARTICLES_FALLBACK } from '$lib/landing/articles-fallback';

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

export type LandingArticle = {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	authorName: string;
	cover?: string;
	/** External cover URL (e.g. from hoomban.com) when not stored in PocketBase */
	coverSrc?: string;
	sourceUrl?: string;
	updated: string;
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

function mapLandingArticle(item: Record<string, unknown>): LandingArticle {
	const expand = item.expand as { author?: { name?: string } } | undefined;
	const authorRel = item.author;
	let authorName = expand?.author?.name ? String(expand.author.name) : '';
	if (!authorName && typeof authorRel === 'string') authorName = '';
	if (!authorName) authorName = 'تیم هومبان';

	const excerpt = String(item.excerpt || item.content || '').trim();
	return {
		id: String(item.id),
		title: String(item.title || ''),
		slug: String(item.slug || item.id),
		excerpt: excerpt.length > 160 ? `${excerpt.slice(0, 157)}…` : excerpt,
		authorName,
		cover: item.cover ? String(item.cover) : undefined,
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

export function getLandingArticleCoverUrl(
	article: Pick<LandingArticle, 'id' | 'cover' | 'coverSrc' | 'updated'>
): string | null {
	if (article.coverSrc) return article.coverSrc;
	if (!article.cover) return null;
	const base = pb.files.getURL(
		{ id: article.id, collectionName: 'articles' } as never,
		article.cover
	);
	return article.updated ? `${base}?v=${encodeURIComponent(article.updated)}` : base;
}

export function resolveLandingArticles(articles: LandingArticle[]): LandingArticle[] {
	if (articles.length > 0) return articles.slice(0, 6);
	return LANDING_ARTICLES_FALLBACK;
}

export async function loadPublishedArticles(limit = 50): Promise<LandingArticle[]> {
	try {
		const result = await pb.collection('articles').getList(1, limit, {
			filter: 'is_published = true',
			sort: '-created',
			expand: 'author'
		});
		const mapped = result.items.map((item) =>
			mapLandingArticle(item as unknown as Record<string, unknown>)
		);
		return mapped.length > 0 ? mapped : LANDING_ARTICLES_FALLBACK;
	} catch {
		return LANDING_ARTICLES_FALLBACK;
	}
}

export async function loadLandingPublicData(): Promise<{
	doctors: LandingDoctor[];
	services: LandingService[];
	testimonials: LandingTestimonial[];
	articles: LandingArticle[];
}> {
	const [doctorItems, servicesResult, testimonialsResult, articlesResult] = await Promise.all([
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
		}),
		pb.collection('articles').getList(1, 6, {
			filter: 'is_published = true',
			sort: '-created',
			expand: 'author'
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
		}),
		articles: resolveLandingArticles(
			articlesResult.items.map((item) =>
				mapLandingArticle(item as unknown as Record<string, unknown>)
			)
		)
	};
}
