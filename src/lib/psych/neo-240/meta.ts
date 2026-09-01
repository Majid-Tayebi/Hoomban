export const NEO_LIKERT_OPTIONS = [
	{ text: 'کاملاً مخالفم', value: 0 },
	{ text: 'مخالفم', value: 1 },
	{ text: 'نظری ندارم', value: 2 },
	{ text: 'موافقم', value: 3 },
	{ text: 'کاملاً موافقم', value: 4 }
] as const;

export const NEO_TEST_SLUG = 'neo-240';
export const NEO_TEST_TYPE = 'neo_240';
export const NEO_PAGE_SIZE = 10;

export type NeoDomainKey = 'N' | 'E' | 'O' | 'A' | 'C';

export type NeoFacetKey =
	| 'N1'
	| 'N2'
	| 'N3'
	| 'N4'
	| 'N5'
	| 'N6'
	| 'E1'
	| 'E2'
	| 'E3'
	| 'E4'
	| 'E5'
	| 'E6'
	| 'O1'
	| 'O2'
	| 'O3'
	| 'O4'
	| 'O5'
	| 'O6'
	| 'A1'
	| 'A2'
	| 'A3'
	| 'A4'
	| 'A5'
	| 'A6'
	| 'C1'
	| 'C2'
	| 'C3'
	| 'C4'
	| 'C5'
	| 'C6';

export const NEO_DOMAINS: {
	key: NeoDomainKey;
	label: string;
	description: string;
}[] = [
	{
		key: 'N',
		label: 'روان‌رنجوری',
		description: 'تمایل به تجربه هیجانات منفی مانند اضطراب، غم و تنش.'
	},
	{
		key: 'E',
		label: 'برون‌گرایی',
		description: 'تمایل به تعامل اجتماعی، انرژی و هیجانات مثبت.'
	},
	{
		key: 'O',
		label: 'گشودگی به تجربه',
		description: 'کنجکاوی فکری، خلاقیت و پذیرش ایده‌های نو.'
	},
	{
		key: 'A',
		label: 'توافق‌پذیری',
		description: 'همدلی، همکاری و احترام به دیگران.'
	},
	{
		key: 'C',
		label: 'مسئولیت‌پذیری',
		description: 'نظم، پشتکار و کنترل تکانه‌ها.'
	}
];

export const NEO_FACETS: {
	key: NeoFacetKey;
	domain: NeoDomainKey;
	label: string;
}[] = [
	{ key: 'N1', domain: 'N', label: 'اضطراب' },
	{ key: 'N2', domain: 'N', label: 'پرخاشگری' },
	{ key: 'N3', domain: 'N', label: 'افسردگی' },
	{ key: 'N4', domain: 'N', label: 'حساسیت به خود' },
	{ key: 'N5', domain: 'N', label: 'تکانش‌وری' },
	{ key: 'N6', domain: 'N', label: 'آسیب‌پذیری' },
	{ key: 'E1', domain: 'E', label: 'صمیمیت' },
	{ key: 'E2', domain: 'E', label: 'جمع‌گرایی' },
	{ key: 'E3', domain: 'E', label: 'قاطعیت' },
	{ key: 'E4', domain: 'E', label: 'فعالیت' },
	{ key: 'E5', domain: 'E', label: 'هیجان‌خواهی' },
	{ key: 'E6', domain: 'E', label: 'هیجان مثبت' },
	{ key: 'O1', domain: 'O', label: 'تخیل' },
	{ key: 'O2', domain: 'O', label: 'زیبایی‌پسندی' },
	{ key: 'O3', domain: 'O', label: 'احساسات' },
	{ key: 'O4', domain: 'O', label: 'اعمال' },
	{ key: 'O5', domain: 'O', label: 'عقاید' },
	{ key: 'O6', domain: 'O', label: 'ارزش‌ها' },
	{ key: 'A1', domain: 'A', label: 'اعتماد' },
	{ key: 'A2', domain: 'A', label: 'سادگی' },
	{ key: 'A3', domain: 'A', label: 'نوع‌دوستی' },
	{ key: 'A4', domain: 'A', label: 'تبعییت' },
	{ key: 'A5', domain: 'A', label: 'تواضع' },
	{ key: 'A6', domain: 'A', label: 'درک دیگران' },
	{ key: 'C1', domain: 'C', label: 'کفایت' },
	{ key: 'C2', domain: 'C', label: 'نظم و قدرت' },
	{ key: 'C3', domain: 'C', label: 'وظیفه‌شناسی' },
	{ key: 'C4', domain: 'C', label: 'تلاش برای موفقیت' },
	{ key: 'C5', domain: 'C', label: 'خویشتنداری' },
	{ key: 'C6', domain: 'C', label: 'محتاط در تصمیم‌گیری' }
];

export const NEO_DOMAIN_MAX = 192;
export const NEO_FACET_MAX = 32;
