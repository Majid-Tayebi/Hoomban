import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminPb } from '$lib/server/pocketbase';
import { finalizeZarinpalCallback } from '$lib/server/payments/appointment-checkout';

export const GET: RequestHandler = async ({ url }) => {
	const authority = String(url.searchParams.get('Authority') || url.searchParams.get('authority') || '');
	const status = url.searchParams.get('Status') || url.searchParams.get('status');

	const pb = await getAdminPb();
	const result = await finalizeZarinpalCallback(pb, { authority, status });

	const params = new URLSearchParams();
	params.set('status', result.ok ? 'success' : 'failed');
	if (result.appointmentId) params.set('appointment', result.appointmentId);
	if (result.refId) params.set('ref', result.refId);
	params.set('message', result.message);

	throw redirect(303, `/appointments/payment/result?${params.toString()}`);
};
