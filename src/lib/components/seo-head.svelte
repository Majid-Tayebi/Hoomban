<script lang="ts">
	import { HOOMBAN_BRAND_NAME } from '$lib/brand/logo';
	import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_HEIGHT, DEFAULT_OG_IMAGE_WIDTH } from '$lib/seo/schema';
	import { absoluteUrl } from '$lib/seo/site-url';

	let {
		title = `${HOOMBAN_BRAND_NAME} | کلینیک روانشناسی`,
		description = 'کلینیک روانشناسی هومبان — نوبت‌دهی آنلاین، مشاوره و آزمون‌های روان‌شناختی',
		path = '/',
		image = DEFAULT_OG_IMAGE,
		type = 'website',
		jsonLd = null as Record<string, unknown> | Record<string, unknown>[] | null,
		noindex = false,
		ogImageWidth = DEFAULT_OG_IMAGE_WIDTH,
		ogImageHeight = DEFAULT_OG_IMAGE_HEIGHT
	}: {
		title?: string;
		description?: string;
		path?: string;
		image?: string;
		type?: 'website' | 'article';
		jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
		noindex?: boolean;
		ogImageWidth?: number;
		ogImageHeight?: number;
	} = $props();

	const canonical = $derived(absoluteUrl(path));
	const ogImage = $derived(image.startsWith('http') ? image : absoluteUrl(image));
	const jsonLdBlocks = $derived(
		jsonLd == null ? [] : Array.isArray(jsonLd) ? jsonLd : [jsonLd]
	);
</script>

<svelte:head>
	<title>{title}</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="fa-IR" href={canonical} />
	<link rel="alternate" hreflang="x-default" href={canonical} />
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}

	<meta property="og:site_name" content={HOOMBAN_BRAND_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content="fa_IR" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content={String(ogImageWidth)} />
	<meta property="og:image:height" content={String(ogImageHeight)} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />

	{#each jsonLdBlocks as block, i (i)}
		<script type="application/ld+json">
			{JSON.stringify(block)}
		</script>
	{/each}
</svelte:head>
