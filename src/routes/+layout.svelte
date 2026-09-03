<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/assets/app.css';
	import { hydrateTheme } from '$lib/theme.svelte';
	import { HOOMBAN_BRAND_NAME } from '$lib/brand/logo';
	import { registerServiceWorker } from '$lib/push/push-client';
	import { hydrateAuthFromSession } from '$lib/auth.svelte';

	let { children } = $props();

	$effect(() => {
		hydrateTheme();
	});

	$effect(() => {
		void registerServiceWorker().catch(() => {});
	});

	$effect(() => {
		void hydrateAuthFromSession();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="apple-touch-icon" href="/images/hoomban-logo-192.png" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content={HOOMBAN_BRAND_NAME} />
	<meta name="mobile-web-app-capable" content="yes" />
</svelte:head>

{@render children()}
