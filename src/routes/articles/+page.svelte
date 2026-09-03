<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import BrandLogo from '$lib/components/brand-logo.svelte';
	import LandingArticleCard from '$lib/landing/components/landing-article-card.svelte';
	import type { LandingArticle } from '$lib/landing/public-data';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { HOOMBAN_BRAND_NAME } from '$lib/brand/logo';
	import { collectionPageJsonLd, breadcrumbJsonLd } from '$lib/seo/schema';

	let {
		data
	}: {
		data: { articles: LandingArticle[] };
	} = $props();

	const articles = $derived(data.articles);
	const jsonLd = $derived([
		collectionPageJsonLd({
			name: `مجله سلامت روان | ${HOOMBAN_BRAND_NAME}`,
			description: 'مقالات و نوشته‌های آموزشی درباره سلامت روان',
			path: '/articles',
			items: articles.slice(0, 20).map((a) => ({
				name: a.title,
				path: `/articles/${a.slug}`
			}))
		}),
		breadcrumbJsonLd([
			{ name: 'خانه', path: '/' },
			{ name: 'مقالات', path: '/articles' }
		])
	]);
</script>

<SeoHead
	title={`مجله سلامت روان | ${HOOMBAN_BRAND_NAME}`}
	description="مقالات و نوشته‌های آموزشی درباره سلامت روان — کلینیک هومبان اراک"
	path="/articles"
	jsonLd={jsonLd}
/>

<div class="min-h-dvh bg-white text-foreground dark:bg-background">
	<header class="border-b border-border px-4 py-4 sm:px-6">
		<div class="page-container flex items-center justify-between gap-4">
			<a href="/" class="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80">
				<BrandLogo class="h-9 w-9" width={72} height={72} />
				<span class="font-bold">{HOOMBAN_BRAND_NAME}</span>
			</a>
			<a
				href="/"
				class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
			>
				<ArrowRight class="h-4 w-4" />
				بازگشت به خانه
			</a>
		</div>
	</header>

	<main class="page-container px-4 py-10 sm:px-6 sm:py-14">
		<div class="mx-auto mb-10 max-w-2xl text-center">
			<h1 class="text-2xl font-bold tracking-tight sm:text-4xl">مجله سلامت روان</h1>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
				همه مقالات و نوشته‌های منتشرشده توسط تیم درمان هومبان
			</p>
		</div>

		{#if articles.length}
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
				{#each articles as article (article.id)}
					<LandingArticleCard {article} />
				{/each}
			</div>
		{:else}
			<div
				class="rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center"
			>
				<p class="text-sm text-muted-foreground">به‌زودی مقالات جدید منتشر می‌شود.</p>
			</div>
		{/if}
	</main>
</div>
