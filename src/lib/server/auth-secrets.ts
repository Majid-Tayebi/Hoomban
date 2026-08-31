import { randomBytes, randomInt } from 'crypto';

/** PocketBase requires a password on user create; never expose this to clients. */
export function generateSecurePassword(): string {
	return randomBytes(32).toString('base64url');
}

/** Six-digit OTP for login / mobile-change flows. */
export function generateOtpCode(): string {
	return String(randomInt(100_000, 1_000_000));
}
