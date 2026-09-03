import { CLINIC_CITY, CLINIC_LEGAL_NAME, CLINIC_TAGLINE } from '$lib/brand/clinic';
import { HOOMBAN_BRAND_NAME, HOOMBAN_LOGO_PNG_192 } from '$lib/brand/logo';
import { absoluteUrl, getSiteUrl } from '$lib/seo/site-url';

/** Default share image — dedicated 1200×630 OG banner. */
export const DEFAULT_OG_IMAGE = '/images/og-default.png';
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;

export function localBusinessJsonLd() {
	const site = getSiteUrl();
	return {
		'@context': 'https://schema.org',
		'@type': 'MedicalClinic',
		name: CLINIC_LEGAL_NAME,
		alternateName: HOOMBAN_BRAND_NAME,
		description: CLINIC_TAGLINE,
		url: site,
		logo: absoluteUrl(HOOMBAN_LOGO_PNG_192),
		image: absoluteUrl(DEFAULT_OG_IMAGE),
		address: {
			'@type': 'PostalAddress',
			addressLocality: CLINIC_CITY,
			addressCountry: 'IR'
		},
		medicalSpecialty: ['Psychiatric', 'Psychology'],
		inLanguage: 'fa-IR'
	};
}

export function websiteJsonLd() {
	const site = getSiteUrl();
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: HOOMBAN_BRAND_NAME,
		alternateName: CLINIC_LEGAL_NAME,
		url: site,
		inLanguage: 'fa-IR',
		publisher: {
			'@type': 'Organization',
			name: CLINIC_LEGAL_NAME,
			logo: absoluteUrl(HOOMBAN_LOGO_PNG_192)
		}
	};
}

export type BreadcrumbItem = { name: string; path: string };

/** BreadcrumbList for nested public pages. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: absoluteUrl(item.path)
		}))
	};
}

export function collectionPageJsonLd(input: {
	name: string;
	description: string;
	path: string;
	items?: Array<{ name: string; path: string }>;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: input.name,
		description: input.description,
		url: absoluteUrl(input.path),
		inLanguage: 'fa-IR',
		...(input.items?.length
			? {
					mainEntity: {
						'@type': 'ItemList',
						itemListElement: input.items.map((item, i) => ({
							'@type': 'ListItem',
							position: i + 1,
							name: item.name,
							url: absoluteUrl(item.path)
						}))
					}
				}
			: {})
	};
}

export function articleJsonLd(input: {
	title: string;
	description: string;
	url: string;
	datePublished?: string;
	dateModified?: string;
	authorName?: string;
	image?: string;
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: input.title,
		description: input.description,
		url: input.url,
		inLanguage: 'fa-IR',
		datePublished: input.datePublished || input.dateModified,
		dateModified: input.dateModified || input.datePublished,
		author: {
			'@type': 'Person',
			name: input.authorName || HOOMBAN_BRAND_NAME
		},
		publisher: {
			'@type': 'Organization',
			name: CLINIC_LEGAL_NAME,
			logo: {
				'@type': 'ImageObject',
				url: absoluteUrl(HOOMBAN_LOGO_PNG_192)
			}
		},
		...(input.image ? { image: [input.image] } : {})
	};
}

export function faqPageJsonLd(items: Array<{ question: string; answer: string }>) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: items.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer
			}
		}))
	};
}
