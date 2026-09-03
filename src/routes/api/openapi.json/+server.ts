import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { openApiDocument } from '$lib/server/openapi/spec';

export const GET: RequestHandler = async () => {
	return json(openApiDocument, {
		headers: {
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
