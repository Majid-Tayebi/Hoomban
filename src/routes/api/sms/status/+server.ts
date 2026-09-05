import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	isLocalHostEnvironment,
	isSmsDispatchAllowed,
	isSmsirBulkConfigured,
	isSmsirConfigured,
	isSmsirLocalOnly,
	isSmsirSandbox,
	shouldStubBulkSms
} from '$lib/server/sms/smsir-config';
import { smsirGetCredit, SmsIrError } from '$lib/server/sms/smsir-client';
import { getAuthUserFromRequest } from '$lib/server/request-auth';

/** Admin / secretary: SMS.ir readiness checklist (no secrets). */
export const GET: RequestHandler = async ({ request, cookies }) => {
	const actor = await getAuthUserFromRequest(request, cookies);
	if (!actor || (actor.role !== 'admin' && actor.role !== 'secretary')) {
		return json({ error: 'دسترسی ندارید' }, { status: 403 });
	}

	const configured = await isSmsirConfigured();
	const dispatchAllowed = await isSmsDispatchAllowed();

	let credit: number | null = null;
	let creditError: string | undefined;

	if (configured && dispatchAllowed) {
		try {
			credit = await smsirGetCredit();
		} catch (err: unknown) {
			creditError = err instanceof SmsIrError ? err.message : 'خطا در دریافت اعتبار';
		}
	}

	return json({
		provider: 'sms.ir',
		configured,
		bulkConfigured: await isSmsirBulkConfigured(),
		bulkStubMode: await shouldStubBulkSms(),
		sandbox: isSmsirSandbox(),
		localOnly: isSmsirLocalOnly(),
		localHost: isLocalHostEnvironment(),
		dispatchAllowed,
		credit,
		creditError
	});
};
