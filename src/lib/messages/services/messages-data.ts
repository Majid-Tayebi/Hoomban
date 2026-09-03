import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
import type { AuthUser } from '$lib/auth.svelte';
import { formatFaDate, formatFaTime } from '$lib/date';
import type { MessageFolder, MessageThread } from '../types';

type MessagesUser = NonNullable<AuthUser>;

const ROLE_LABELS: Record<string, string> = {
	admin: 'مدیر کلینیک',
	secretary: 'منشی',
	doctor: 'روانشناس',
	writer: 'نویسنده',
	patient: 'مراجع'
};

function formatMessageTime(created: string): string {
	const d = new Date(created);
	if (Number.isNaN(d.getTime())) return '—';

	const now = new Date();
	const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	const diffDays = Math.round((startToday.getTime() - startMsg.getTime()) / 86_400_000);

	if (diffDays === 0) return formatFaTime(d);
	if (diffDays === 1) return 'دیروز';
	if (diffDays < 7) return `${diffDays.toLocaleString('fa-IR')} روز پیش`;
	return formatFaDate(d);
}

function previewBody(body: string): string {
	const flat = body.replace(/\s+/g, ' ').trim();
	return flat.length > 80 ? `${flat.slice(0, 80)}…` : flat;
}

type PbUser = { id?: string; name?: string; role?: string };

function mapMessageRecord(
	row: Record<string, unknown>,
	userId: string
): MessageThread | null {
	const expand = row.expand as {
		sender?: PbUser;
		recipient?: PbUser;
	} | undefined;

	const senderId = String(
		(typeof row.sender === 'string' ? row.sender : expand?.sender?.id) || ''
	);
	const recipientId = String(
		(typeof row.recipient === 'string' ? row.recipient : expand?.recipient?.id) || ''
	);

	if (!senderId || !recipientId) return null;

	const isSent = senderId === userId;
	const folder: MessageFolder = isSent ? 'sent' : 'inbox';
	const peer = isSent ? expand?.recipient : expand?.sender;
	const body = String(row.body || '');

	return {
		id: String(row.id),
		from: isSent ? 'شما' : String(peer?.name || 'کاربر'),
		role: isSent ? 'ارسال‌شده' : ROLE_LABELS[String(peer?.role || '')] || 'کارمند',
		subject: String(row.subject || ''),
		preview: previewBody(body),
		body,
		time: formatMessageTime(String(row.created || '')),
		unread: !isSent && !row.read_at,
		starred: Boolean(row.starred),
		folder
	};
}

export async function loadMessageThreads(user: MessagesUser): Promise<MessageThread[]> {
	if (user.id === 'demo-user') return [];

	try {
		const result = await pb.collection('internal_messages').getList(1, 100, {
			filter: `sender = "${user.id}" || recipient = "${user.id}"`,
			expand: 'sender,recipient',
			sort: '-created',
			...PB_NO_AUTO_CANCEL
		});

		return result.items
			.map((row) => mapMessageRecord(row as unknown as Record<string, unknown>, user.id))
			.filter((t): t is MessageThread => Boolean(t));
	} catch {
		return [];
	}
}

export type MessageRecipient = {
	id: string;
	name: string;
	role: string;
};

export async function loadMessageRecipients(): Promise<MessageRecipient[]> {
	const res = await fetch('/api/messages/recipients', {
		headers: {
			...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
		}
	});
	const data = (await res.json()) as { recipients?: MessageRecipient[]; error?: string };
	if (!res.ok) throw new Error(data.error || 'بارگذاری گیرندگان ناموفق بود');
	return data.recipients ?? [];
}

export async function sendMessage(input: {
	recipientId: string;
	subject: string;
	body: string;
}): Promise<MessageThread> {
	const res = await fetch('/api/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
		},
		body: JSON.stringify(input)
	});
	const data = (await res.json()) as { thread?: MessageThread; error?: string };
	if (!res.ok || !data.thread) throw new Error(data.error || 'ارسال پیام ناموفق بود');
	return data.thread;
}

export async function markMessageRead(id: string): Promise<void> {
	await fetch(`/api/messages/${id}/read`, {
		method: 'POST',
		headers: {
			...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
		}
	});
}

export async function toggleMessageStar(id: string, starred: boolean): Promise<void> {
	await fetch(`/api/messages/${id}/star`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
		},
		body: JSON.stringify({ starred })
	});
}
