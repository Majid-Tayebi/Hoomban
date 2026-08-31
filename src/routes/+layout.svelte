<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/assets/app.css';
	import { hydrateTheme } from '$lib/theme.svelte';
	import { browser } from '$app/environment';
	import { registerServiceWorker } from '$lib/push/push-client';

	let { children } = $props();

	$effect(() => {
		hydrateTheme();
	});

	$effect(() => {
		if (!browser) return;
		void registerServiceWorker().catch(() => {
			/* dev mode may not bundle SW */
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="apple-touch-icon" href="/images/hoomban-logo.png" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="هومبان" />
	<meta name="mobile-web-app-capable" content="yes" />
	<title>هومبان | کلینیک روانشناسی</title>
</svelte:head>

{@render children()}
