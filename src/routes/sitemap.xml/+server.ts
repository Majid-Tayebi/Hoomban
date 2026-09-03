import type { RequestHandler } from './$types';
import { getAdminPb } from '$lib/server/pocketbase';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { absoluteUrl } from '$lib/seo/site-url';
import { getCachedJson } from '$lib/server/cache';

type SitemapEntry = {
	loc: string;
	changefreq: 'daily' | 'weekly' | 'monthly';
	priority: string;
	lastmod?: string;
};

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function toXml(entries: SitemapEntry[]): string {
	const body = entries
		.map((entry) => {
			const lastmod = entry.lastmod
				? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>`
				: '';
			return `<url><loc>${escapeXml(entry.loc)}</loc>${lastmod}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`;
		})
		.join('');
	return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export const GET: RequestHandler = async () => {
	const xml = await getCachedJson('public:sitemap-xml', 3600, async () => {
		const entries: SitemapEntry[] = [
			{ loc: absoluteUrl('/'), changefreq: 'weekly', priority: '1.0' },
			{ loc: absoluteUrl('/articles'), changefreq: 'weekly', priority: '0.8' },
			{ loc: absoluteUrl('/faq'), changefreq: 'monthly', priority: '0.6' },
			{ loc: absoluteUrl('/tests'), changefreq: 'weekly', priority: '0.7' },
			{ loc: absoluteUrl('/appointments/book'), changefreq: 'monthly', priority: '0.7' }
		];

		try {
			const pb = await getAdminPb();
			const articles = await pb.collection('articles').getFullList({
				filter: 'is_published = true',
				fields: 'slug,updated',
				...PB_NO_AUTO_CANCEL
			});
			for (const article of articles) {
				const slug = String(article.slug || article.id);
				entries.push({
					loc: absoluteUrl(`/articles/${slug}`),
					changefreq: 'monthly',
					priority: '0.7',
					lastmod: article.updated ? String(article.updated).slice(0, 10) : undefined
				});
			}

			const tests = await pb.collection('psych_tests').getFullList({
				filter: 'is_active = true',
				fields: 'slug,updated',
				...PB_NO_AUTO_CANCEL
			});
			for (const test of tests) {
				const slug = String(test.slug || test.id);
				entries.push({
					loc: absoluteUrl(`/tests/${slug}`),
					changefreq: 'monthly',
					priority: '0.6',
					lastmod: test.updated ? String(test.updated).slice(0, 10) : undefined
				});
			}
		} catch {
			// Static entries only when PocketBase is unavailable.
		}

		return toXml(entries);
	});

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200'
		}
	});
};
