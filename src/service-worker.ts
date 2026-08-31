/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

const self = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (globalThis.self));

const CACHE = `hoomban-${version}`;
const ASSETS = [...build, ...files];

const ICON = '/images/hoomban-logo-192.png';

/** Never cache API or PocketBase responses — static assets + images only. */
function shouldCacheRequest(url: URL): boolean {
	if (url.pathname.startsWith('/api/')) return false;
	if (url.pathname.startsWith('/images/')) return true;
	if (url.pathname.startsWith('/_app/')) return true;
	if (ASSETS.includes(url.pathname)) return true;
	if (url.origin !== self.location.origin) return false;
	return false;
}

type PushPayload = {
	title?: string;
	body?: string;
	href?: string;
	tag?: string;
};

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			await cache.addAll(ASSETS);
		})()
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key !== CACHE) await caches.delete(key);
			}
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		(async () => {
			const url = new URL(event.request.url);
			const cache = await caches.open(CACHE);

			if (ASSETS.includes(url.pathname)) {
				const cached = await cache.match(url.pathname);
				if (cached) return cached;
			}

			try {
				const response = await fetch(event.request);
				if (!(response instanceof Response)) throw new Error('invalid fetch response');
				if (
					response.status === 200 &&
					shouldCacheRequest(url) &&
					!response.headers.get('cache-control')?.includes('no-store')
				) {
					cache.put(event.request, response.clone());
				}
				return response;
			} catch {
				const cached = await cache.match(event.request);
				if (cached) return cached;
				throw new Error('offline');
			}
		})()
	);
});

self.addEventListener('push', (event) => {
	const data: PushPayload = event.data ? event.data.json() : {};
	const title = data.title || 'هومبان';
	const body = data.body || '';
	const href = data.href || '/dashboard';
	const tag = data.tag || 'hoomban-notification';

	event.waitUntil(
		(async () => {
			const windowClients = await self.clients.matchAll({
				type: 'window',
				includeUncontrolled: true
			});
			const visibleClient = windowClients.find(
				(client) =>
					'visibilityState' in client &&
					(client as WindowClient).visibilityState === 'visible'
			);

			if (visibleClient) {
				visibleClient.postMessage({
					type: 'hoomban-push',
					payload: { title, body, href, tag }
				});
				return;
			}

			await self.registration.showNotification(title, {
				body,
				icon: ICON,
				badge: ICON,
				tag,
				data: { href },
				dir: 'rtl',
				lang: 'fa'
			});
		})()
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const href =
		(event.notification.data && typeof event.notification.data.href === 'string'
			? event.notification.data.href
			: null) || '/dashboard';

	event.waitUntil(
		(async () => {
			const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
			for (const client of allClients) {
				if ('focus' in client) {
					await client.focus();
					if ('navigate' in client && typeof client.navigate === 'function') {
						await client.navigate(href);
					}
					return;
				}
			}
			await self.clients.openWindow(href);
		})()
	);
});
