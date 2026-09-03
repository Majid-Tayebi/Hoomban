import { env } from '$env/dynamic/public';
import PocketBase, { BaseAuthStore } from 'pocketbase';

const PB_URL = env.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

/**
 * In-memory auth store — do not persist PocketBase tokens in localStorage.
 * Session is restored from the httpOnly cookie via GET /api/auth/session.
 */
export const pb = new PocketBase(PB_URL, new BaseAuthStore());

/** Prevent concurrent client requests from aborting each other. */
export const PB_NO_AUTO_CANCEL = { $autoCancel: false as const };
