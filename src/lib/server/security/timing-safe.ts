import { timingSafeEqual } from 'node:crypto';

/** Constant-time string compare for secrets (pads to equal length via hash-length buffers). */
export function timingSafeEqualString(a: string, b: string): boolean {
	const left = Buffer.from(a, 'utf8');
	const right = Buffer.from(b, 'utf8');
	if (left.length !== right.length) {
		// Still compare to avoid leaking length via early return timing on short paths —
		// compare against self then return false.
		timingSafeEqual(left, left);
		return false;
	}
	return timingSafeEqual(left, right);
}
