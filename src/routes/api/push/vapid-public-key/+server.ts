import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getVapidPublicKey, isVapidConfigured } from '$lib/server/push/vapid';

export const GET: RequestHandler = async () => {
	const publicKey = getVapidPublicKey();
	return json({
		configured: isVapidConfigured(),
		publicKey: publicKey ?? null
	});
};
