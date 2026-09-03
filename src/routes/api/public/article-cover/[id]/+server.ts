import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';

/**
 * Proxy published article covers through the app origin so OG crawlers
 * never need direct access to PocketBase (:8090).
 *
 * GET /api/public/article-cover/[id]
 */
export const GET: RequestHandler = async ({ params }) => {
	const id = params.id?.trim();
	if (!id || id.length < 5) error(404, 'Not found');

	try {
		const pb = await getAdminPb();
		const article = await pb.collection('articles').getOne(id, {
			fields: 'id,cover,is_published,updated',
			...PB_NO_AUTO_CANCEL
		});

		if (!article.is_published || !article.cover) error(404, 'Not found');

		const fileUrl = pb.files.getURL(article, String(article.cover));
		const upstream = await fetch(fileUrl);
		if (!upstream.ok || !upstream.body) error(404, 'Not found');

		const contentType = upstream.headers.get('content-type') || 'image/jpeg';
		const cacheKey = article.updated ? String(article.updated) : id;

		return new Response(upstream.body, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
				ETag: `"${cacheKey}"`,
				'X-Content-Type-Options': 'nosniff'
			}
		});
	} catch {
		error(404, 'Not found');
	}
};
