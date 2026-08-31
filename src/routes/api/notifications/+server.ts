import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { mapNotificationRecord } from '$lib/notifications/types';

/** PocketBase rejects `sort: '-created'` on notifications — sort after fetch. */
type NotifRow = {
	id: string;
	type?: string;
	title?: string;
	body?: string;
	href?: string;
	read_at?: string;
	priority?: string;
	metadata?: unknown;
	created?: string;
};

function sortNewestFirst(items: NotifRow[]): NotifRow[] {
	return [...items].sort(
		(a, b) => new Date(String(b.created || 0)).getTime() - new Date(String(a.created || 0)).getTime()
	);
}

export const GET: RequestHandler = async ({ request, url }) => {
	const user = await getAuthUserFromRequest(request);
	if (!user) {
		return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	}

	const limit = Math.min(Number(url.searchParams.get('limit') || 30), 50);

	try {
		const pb = await getAdminPb();
		const result = await pb.collection('notifications').getList(1, limit, {
			filter: `recipient = "${user.id}"`,
			...PB_NO_AUTO_CANCEL
		});

		const items = sortNewestFirst(
			result.items.map((r) => r as unknown as NotifRow)
		).map((r) =>
			mapNotificationRecord({
				id: r.id,
				type: r.type,
				title: r.title,
				body: r.body,
				href: r.href,
				read_at: r.read_at,
				priority: r.priority,
				metadata: r.metadata,
				created: r.created
			})
		);

		return json({ items });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'خطا در بارگذاری اعلان‌ها';
		return json({ error: message }, { status: 500 });
	}
};
