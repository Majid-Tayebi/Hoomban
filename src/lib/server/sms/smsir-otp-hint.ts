import { maybeDemoCode } from '$lib/server/dev-auth';
import { isSmsirSandbox } from '$lib/server/sms/smsir-config';

/**
 * SMS.ir Sandbox never delivers a real SMS — expose the OTP in API responses
 * so developers can complete login during local/testing (same URL as production).
 */
export function maybeExposeOtpForClient(code: string): string | undefined {
	const devCode = maybeDemoCode(code);
	if (devCode) return devCode;
	if (isSmsirSandbox()) return code;
	return undefined;
}

export function isSmsSandboxMode(): boolean {
	return isSmsirSandbox();
}
