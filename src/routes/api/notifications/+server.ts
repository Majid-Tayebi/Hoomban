import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb, PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import { mapNotificationRecord } from '$lib/notifications/types';
import { sortNotificationsNewestFirst } from '$lib/notifications/sort';

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

export const GET: RequestHandler = async ({ request, url, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user) {
		return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	}

	const limit = Math.min(Number(url.searchParams.get('limit') || 30), 50);

	try {
		const pb = await getAdminPb();
		const rows = await pb.collection('notifications').getFullList({
			filter: `recipient = "${user.id}"`,
			sort: '-created',
			...PB_NO_AUTO_CANCEL
		});

		const items = sortNotificationsNewestFirst(rows.map((r) => r as unknown as NotifRow))
			.slice(0, limit)
			.map((r) =>
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
