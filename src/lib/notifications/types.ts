export type NotificationType =
	| 'appointment_created'
	| 'appointment_cancelled'
	| 'appointment_rescheduled'
	| 'system';

export type NotificationPriority = 'normal' | 'urgent';

export type NotificationRecord = {
	id: string;
	type: NotificationType;
	title: string;
	body: string;
	href: string | null;
	readAt: string | null;
	priority: NotificationPriority;
	metadata: Record<string, unknown> | null;
	created: string;
};

export function mapNotificationRecord(record: {
	id: string;
	type?: unknown;
	title?: unknown;
	body?: unknown;
	href?: unknown;
	read_at?: unknown;
	priority?: unknown;
	metadata?: unknown;
	created?: unknown;
}): NotificationRecord {
	return {
		id: record.id,
		type: (String(record.type || 'system') as NotificationType),
		title: String(record.title || ''),
		body: String(record.body || ''),
		href: record.href ? String(record.href) : null,
		readAt: record.read_at ? String(record.read_at) : null,
		priority: (String(record.priority || 'normal') as NotificationPriority),
		metadata:
			record.metadata && typeof record.metadata === 'object'
				? (record.metadata as Record<string, unknown>)
				: null,
		created: String(record.created || '')
	};
}
