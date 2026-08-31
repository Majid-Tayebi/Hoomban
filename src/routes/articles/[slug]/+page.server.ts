import { error } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import { findFallbackArticleBySlug } from '$lib/landing/articles-fallback';
import { getLandingArticleCoverUrl } from '$lib/landing/public-data';

export async function load({ params }) {
	const slug = params.slug?.trim();
	if (!slug) error(404, 'مقاله یافت نشد');

	try {
		const result = await pb.collection('articles').getList(1, 1, {
			filter: `slug = ${JSON.stringify(slug)} && is_published = true`,
			expand: 'author'
		});

		const item = result.items[0];
		if (item) {
			const expand = item.expand as { author?: { name?: string } } | undefined;
			const authorName = expand?.author?.name ? String(expand.author.name) : 'تیم هومبان';
			const updated = String(item.updated || item.created || '');

			const article = {
				id: item.id,
				title: String(item.title || ''),
				slug: String(item.slug || item.id),
				excerpt: String(item.excerpt || ''),
				content: String(item.content || ''),
				authorName,
				sourceUrl: item.source_url ? String(item.source_url) : undefined,
				updated,
				cover: item.cover ? String(item.cover) : undefined
			};

			return {
				article,
				coverUrl: getLandingArticleCoverUrl(article)
			};
		}
	} catch {
		// PocketBase unavailable — try static fallback below.
	}

	const fallback = findFallbackArticleBySlug(slug);
	if (!fallback) error(404, 'مقاله یافت نشد');

	return {
		article: {
			id: fallback.id,
			title: fallback.title,
			slug: fallback.slug,
			excerpt: fallback.excerpt,
			content: fallback.excerpt,
			authorName: fallback.authorName,
			sourceUrl: fallback.sourceUrl,
			updated: fallback.updated
		},
		coverUrl: getLandingArticleCoverUrl(fallback)
	};
}
