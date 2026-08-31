export type NotificationContext = {
	patientName: string;
	doctorName: string;
	specialty: string;
	dateTimeLabel: string;
	statusLabel: string;
	typeLabel: string;
};

function authHeaders(token: string): HeadersInit {
	return {
		Authorization: `Bearer ${token}`
	};
}

/** Load appointment summary for notification detail modal via server API. */
export async function loadNotificationContext(
	appointmentId: string,
	token: string
): Promise<NotificationContext | null> {
	try {
		const res = await fetch(
			`/api/notifications/context?appointmentId=${encodeURIComponent(appointmentId)}`,
			{ headers: authHeaders(token) }
		);
		if (!res.ok) return null;
		return (await res.json()) as NotificationContext;
	} catch {
		return null;
	}
}

export function notificationDestinationLabel(href: string | null): string {
	if (!href) return 'بستن';
	if (href.includes('/appointments')) return 'رفتن به نوبت‌ها';
	if (href.includes('/calendar')) return 'رفتن به تقویم';
	if (href.includes('/patients')) return 'رفتن به مراجعان';
	return 'مشاهده جزئیات';
}
