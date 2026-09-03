import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		runes: ({ filename }) =>
			filename.split(/[/\\]/).includes('node_modules') ? undefined : true
	},
	kit: {
		adapter: adapter(),
		csp: {
			mode: 'nonce',
			directives: {
				'default-src': ['self'],
				'img-src': ['self', 'data:', 'blob:', 'https:'],
				'font-src': ['self', 'data:'],
				// Avoid broad `https:` — add production PocketBase host here if not same-origin.
				'connect-src': [
					'self',
					'http://127.0.0.1:8090',
					'http://localhost:8090',
					'https://api.zarinpal.com',
					'https://sandbox.zarinpal.com',
					'https://payment.zarinpal.com',
					'https://*.ingest.sentry.io',
					'https://*.ingest.de.sentry.io'
				],
				'media-src': ['self', 'blob:'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		}
	}
};

export default config;
