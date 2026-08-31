import type { LandingArticle } from '$lib/landing/public-data';

/** Curated articles from hoomban.com — shown when PocketBase has no published posts yet. */
export const LANDING_ARTICLES_FALLBACK: LandingArticle[] = [
	{
		id: 'fallback-1',
		title: 'نقش روان‌درمانی و روانکاوی در بهبود اختلالات روانی',
		slug: 'نقش-رواندرمانی-و-روانکاوی',
		excerpt:
			'اختلالات روانی یکی از مهم‌ترین چالش‌های سلامت عمومی هستند؛ از اضطراب و افسردگی تا اختلالات شخصیت و تروما.',
		authorName: 'تیم هومبان',
		coverSrc: 'https://hoomban.com/wp-content/uploads/2026/05/%D8%B1%D9%88%D8%A7%D9%86%DA%A9%D8%A7%D9%88%DB%8C-%D9%88-%D8%B1%D9%88%D8%A7%D9%86%D8%AF%D8%B1%D9%85%D8%A7%D9%86%DB%8C.jpg',
		sourceUrl: 'https://hoomban.com/?p=6246',
		updated: ''
	},
	{
		id: 'fallback-2',
		title: 'احساس غربت در جهان؛ روایتی از دلِ یک روانشناس',
		slug: 'احساس-غربت-در-جهان',
		excerpt:
			'روایتی درباره حس تعلق‌نداشتن به دنیا در اتاق درمان — نوشته الهام عظیمیان، روانشناس کلینیک هومبان.',
		authorName: 'الهام عظیمیان',
		coverSrc: 'https://hoomban.com/wp-content/uploads/2026/05/2202.jpg',
		sourceUrl: 'https://hoomban.com/?p=6224',
		updated: ''
	},
	{
		id: 'fallback-3',
		title: 'اضطراب مرگ و میل به جاودانگی: نگاه یک روانشناس همدل',
		slug: 'اضطراب-مرگ-و-میل-به-جاودانگی',
		excerpt:
			'درباره آگاهی از پایان، اضطراب وجودی و راه‌های مواجهه سالم — نوشته الهام عظیمیان.',
		authorName: 'الهام عظیمیان',
		coverSrc: 'https://hoomban.com/wp-content/uploads/2026/05/2201.jpg',
		sourceUrl: 'https://hoomban.com/?p=6223',
		updated: ''
	},
	{
		id: 'fallback-4',
		title: 'نقشه مغزی (QEEG) چیست؟',
		slug: 'qeeg',
		excerpt:
			'نقشه مغزی یا Quantitative Electroencephalography یکی از فناوری‌های پیشرفته در علوم اعصاب برای تحلیل کمی سیگنال‌های EEG است.',
		authorName: 'تیم هومبان',
		coverSrc: 'https://hoomban.com/wp-content/uploads/2024/07/hoomban.jpg',
		sourceUrl: 'https://hoomban.com/?p=95',
		updated: ''
	},
	{
		id: 'fallback-5',
		title: 'نوروتراپی چیست؟',
		slug: 'neurotherapy',
		excerpt:
			'نوروتراپی مجموعه‌ای از روش‌های غیرتهاجمی مبتنی بر تعدیل فعالیت مغز مانند نوروفیدبک و تحریک مغزی است.',
		authorName: 'تیم هومبان',
		coverSrc: 'https://hoomban.com/wp-content/uploads/2026/03/112335.jpg',
		sourceUrl: 'https://hoomban.com/?p=94',
		updated: ''
	},
	{
		id: 'fallback-6',
		title: 'فتوبیومدولیشن مغزی چیست؟',
		slug: 'photobiomodulation',
		excerpt:
			'فتوبیومدولیشن مغزی (tPBM) درمان غیرتهاجمی با نور طیف قرمز تا نزدیک‌به‌فروسرخ برای تحریک سلول‌های مغزی است.',
		authorName: 'تیم هومبان',
		coverSrc: 'https://hoomban.com/wp-content/uploads/2026/03/644e08a7-fbc8-4c0b-a3a8-b41ac3f4e7d8.png',
		sourceUrl: 'https://hoomban.com/?p=93',
		updated: ''
	}
];

export function findFallbackArticleBySlug(slug: string): LandingArticle | undefined {
	return LANDING_ARTICLES_FALLBACK.find((a) => a.slug === slug);
}
