import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isZarinpalConfigured, isZarinpalSandbox } from '$lib/server/payments/zarinpal-config';

export const GET: RequestHandler = async () => {
	return json({
		configured: isZarinpalConfigured(),
		sandbox: isZarinpalSandbox()
	});
};
