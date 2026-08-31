import { pb } from '$lib/pocketbase';

export type ZarinpalGatewayStatus = {
	configured: boolean;
	sandbox: boolean;
};

let cachedStatus: { at: number; data: ZarinpalGatewayStatus } | null = null;
const STATUS_CACHE_MS = 60_000;

export async function fetchZarinpalGatewayStatus(): Promise<ZarinpalGatewayStatus> {
	if (cachedStatus && Date.now() - cachedStatus.at < STATUS_CACHE_MS) {
		return cachedStatus.data;
	}

	const res = await fetch('/api/payments/zarinpal/status');
	const data = (await res.json()) as ZarinpalGatewayStatus;
	cachedStatus = { at: Date.now(), data };
	return data;
}

export type StartCheckoutPayload = {
	patientId: string;
	doctorId: string;
	dateTime: string;
	type: 'in_person' | 'service';
	notesPublic?: string;
	serviceTitle?: string;
	servicePriceToman?: number;
};

export async function startAppointmentOnlineCheckout(
	payload: StartCheckoutPayload
): Promise<{ paymentUrl: string; amountToman: number }> {
	const res = await fetch('/api/payments/zarinpal/request', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
		},
		body: JSON.stringify(payload)
	});
	const data = (await res.json()) as {
		paymentUrl?: string;
		amountToman?: number;
		error?: string;
	};
	if (!res.ok || !data.paymentUrl) {
		throw new Error(data.error || 'شروع پرداخت آنلاین ناموفق بود');
	}
	return { paymentUrl: data.paymentUrl, amountToman: Number(data.amountToman || 0) };
}
