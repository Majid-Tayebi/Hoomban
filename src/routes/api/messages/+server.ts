import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';

const STAFF_ROLES = ['admin', 'secretary', 'doctor', 'writer'];

const ROLE_LABELS: Record<string, string> = {
	admin: 'مدیر کلینیک',
	secretary: 'منشی',
	doctor: 'روانشناس',
	writer: 'نویسنده'
};

function mapThread(row: Record<string, unknown>, senderId: string) {
	const expand = row.expand as { sender?: { name?: string; role?: string } } | undefined;
	const body = String(row.body || '');

	return {
		id: String(row.id),
		from: 'شما',
		role: 'ارسال‌شده',
		subject: String(row.subject || ''),
		preview: body.replace(/\s+/g, ' ').trim().slice(0, 80),
		body,
		time: 'همین الان',
		unread: false,
		starred: Boolean(row.starred),
		folder: 'sent' as const
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const user = await getAuthUserFromRequest(request);
	if (!user || !STAFF_ROLES.includes(user.role)) {
		return json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const recipientId = String(body.recipientId ?? '').trim();
		const subject = String(body.subject ?? '').trim();
		const messageBody = String(body.body ?? '').trim();

		if (!recipientId || !subject || !messageBody) {
			return json({ error: 'گیرنده، موضوع و متن الزامی است' }, { status: 400 });
		}

		const pb = await getAdminPb();
		const created = await pb.collection('internal_messages').create({
			sender: user.id,
			recipient: recipientId,
			subject,
			body: messageBody,
			starred: false
		});

		const withExpand = await pb.collection('internal_messages').getOne(created.id, {
			expand: 'sender,recipient'
		});

		return json({
			thread: mapThread(withExpand as unknown as Record<string, unknown>, user.id)
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'ارسال پیام ناموفق بود';
		return json({ error: message }, { status: 500 });
	}
};
