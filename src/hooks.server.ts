import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import { json, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getSessionUser } from '$lib/server/session';
import { assertProductionConfig } from '$lib/server/startup-guards';
import {
	assertSameOrigin,
	isMutatingMethod,
	isOriginCheckExempt
} from '$lib/server/csrf-origin';

assertProductionConfig();

Sentry.init({
	dsn: env.SENTRY_DSN,
	enabled: Boolean(env.SENTRY_DSN),
	tracesSampleRate: 0.1,
	environment: env.NODE_ENV
});

function applySecurityHeaders(response: Response, isProduction: boolean): void {
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	response.headers.set('Cross-Origin-Resource-Policy', 'same-site');

	if (isProduction) {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
}

const customHandle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;

	if (
		pathname.startsWith('/api/') &&
		isMutatingMethod(event.request.method) &&
		!isOriginCheckExempt(pathname)
	) {
		const originCheck = assertSameOrigin(event.request, event.url);
		if (!originCheck.ok) {
			return json({ error: 'درخواست نامعتبر است' }, { status: 403 });
		}
	}

	event.locals.user = await getSessionUser(event.cookies);
	const response = await resolve(event);
	applySecurityHeaders(response, env.NODE_ENV === 'production');
	return response;
};

export const handle = sequence(Sentry.sentryHandle(), customHandle);
export const handleError = Sentry.handleErrorWithSentry();
