import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminPb } from '$lib/server/pocketbase';
import { getSessionUser } from '$lib/server/session';

/**
 * GET /api/users/:id/avatar
 * Streams the user's avatar through the app origin so the browser never depends
 * on PUBLIC_POCKETBASE_URL / file tokens (fixes broken dashboard avatars).
 */
export const GET: RequestHandler = async ({ params, cookies, url }) => {
	const userId = params.id;
	if (!userId) throw error(400, 'شناسه کاربر نامعتبر است');

	const session = await getSessionUser(cookies);
	const isSelf = session?.id === userId;
	const isStaff =
		session?.role === 'admin' || session?.role === 'secretary' || session?.role === 'doctor';
	if (!isSelf && !isStaff) {
		throw error(401, 'احراز هویت لازم است');
	}

	try {
		const pb = await getAdminPb();
		const record = await pb.collection('users').getOne(userId);
		const filename = record.avatar ? String(record.avatar) : '';
		if (!filename) throw error(404, 'عکس پروفایل وجود ندارد');

		const fileUrl = pb.files.getURL(record, filename);
		const upstream = await fetch(fileUrl);
		if (!upstream.ok || !upstream.body) {
			throw error(404, 'فایل عکس یافت نشد');
		}

		const headers = new Headers();
		headers.set(
			'Content-Type',
			upstream.headers.get('Content-Type') || 'application/octet-stream'
		);
		headers.set('Cache-Control', 'private, max-age=120');
		const etag = String(record.updated || filename);
		headers.set('ETag', `"${etag}"`);
		if (url.searchParams.get('v') === etag || url.searchParams.get('v') === filename) {
			headers.set('Cache-Control', 'private, max-age=3600');
		}

		return new Response(upstream.body, { status: 200, headers });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		throw error(404, 'عکس پروفایل یافت نشد');
	}
};
