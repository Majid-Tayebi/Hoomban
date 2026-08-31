import type PocketBase from 'pocketbase';
import { PB_NO_AUTO_CANCEL } from '$lib/server/pocketbase';
import type { NotificationPriority, NotificationType } from '$lib/notifications/types';
import { sendWebPushToUser } from '$lib/server/push/send';

export type CreateNotificationInput = {
	recipientId: string;
	type: NotificationType;
	title: string;
	body?: string;
	href?: string;
	priority?: NotificationPriority;
	metadata?: Record<string, unknown>;
};

export async function createNotification(
	pb: PocketBase,
	input: CreateNotificationInput
): Promise<void> {
	await pb.collection('notifications').create(
		{
			recipient: input.recipientId,
			type: input.type,
			title: input.title,
			body: input.body ?? '',
			href: input.href ?? '',
			priority: input.priority ?? 'normal',
			metadata: input.metadata ?? null
		},
		PB_NO_AUTO_CANCEL
	);

	void sendWebPushToUser(pb, input.recipientId, {
		title: input.title,
		body: input.body,
		href: input.href || '/dashboard',
		tag: input.metadata?.appointmentId ? `apt-${String(input.metadata.appointmentId)}` : undefined
	}).catch((err) => {
		console.error('web push dispatch failed:', err);
	});
}

export async function createNotificationsForUsers(
	pb: PocketBase,
	userIds: string[],
	input: Omit<CreateNotificationInput, 'recipientId'>
): Promise<void> {
	const unique = [...new Set(userIds.filter(Boolean))];
	for (const recipientId of unique) {
		await createNotification(pb, { ...input, recipientId });
	}
}
