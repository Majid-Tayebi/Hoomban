import type { Component } from 'svelte';
import { CalendarClock, CalendarPlus, CalendarX, Info } from '@lucide/svelte';
import type { NotificationRecord, NotificationType } from '$lib/notifications/types';

export type NotificationMeta = {
	label: string;
	icon: Component<{ class?: string }>;
	tone: string;
	accent: string;
};

export function notificationTypeMeta(type: NotificationType): NotificationMeta {
	switch (type) {
		case 'appointment_created':
			return {
				label: 'ثبت نوبت',
				icon: CalendarPlus,
				tone: 'text-emerald-700 bg-emerald-500/12 ring-emerald-500/20',
				accent: 'border-emerald-500/25 bg-emerald-500/[0.04]'
			};
		case 'appointment_cancelled':
			return {
				label: 'لغو نوبت',
				icon: CalendarX,
				tone: 'text-rose-700 bg-rose-500/12 ring-rose-500/20',
				accent: 'border-rose-500/25 bg-rose-500/[0.04]'
			};
		case 'appointment_rescheduled':
			return {
				label: 'تغییر زمان',
				icon: CalendarClock,
				tone: 'text-sky-700 bg-sky-500/12 ring-sky-500/20',
				accent: 'border-sky-500/25 bg-sky-500/[0.04]'
			};
		default:
			return {
				label: 'سیستم',
				icon: Info,
				tone: 'text-violet-700 bg-violet-500/12 ring-violet-500/20',
				accent: 'border-violet-500/25 bg-violet-500/[0.04]'
			};
	}
}

export function resolveNotificationHref(item: NotificationRecord): string | null {
	if (!item.href) return null;
	const appointmentId = item.metadata?.appointmentId;
	let href = item.href;
	if (appointmentId && href.startsWith('/dashboard/appointments')) {
		const url = new URL(href, 'http://local');
		if (!url.searchParams.get('appointment')) {
			url.searchParams.set('appointment', String(appointmentId));
			href = `${url.pathname}?${url.searchParams.toString()}`;
		}
	}
	return href;
}
