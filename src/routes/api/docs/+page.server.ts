import type { PageServerLoad } from './$types';
import { openApiDocument } from '$lib/server/openapi/spec';

export const load: PageServerLoad = async () => {
	const endpoints = Object.entries(openApiDocument.paths).flatMap(([path, item]) =>
		Object.entries(item).map(([method, op]) => ({
			path,
			method: method.toUpperCase(),
			summary: op.summary ?? '',
			tags: op.tags ?? [],
			secured: Boolean(op.security?.length)
		}))
	);

	const grouped = endpoints.reduce<Record<string, typeof endpoints>>((acc, entry) => {
		const tag = entry.tags[0] ?? 'other';
		(acc[tag] ??= []).push(entry);
		return acc;
	}, {});

	return {
		version: openApiDocument.info.version,
		grouped
	};
};
