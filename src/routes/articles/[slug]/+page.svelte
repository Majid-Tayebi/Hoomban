<script lang="ts">
	import { page } from '$app/stores';
	import { ArrowRight } from '@lucide/svelte';
	import BrandLogo from '$lib/components/brand-logo.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { articleJsonLd, breadcrumbJsonLd } from '$lib/seo/schema';
	import { absoluteUrl } from '$lib/seo/site-url';
	import { HOOMBAN_BRAND_NAME } from '$lib/brand/logo';

	let {
		data
	}: {
		data: {
			article: {
				title: string;
				excerpt: string;
				content: string;
				authorName: string;
				sourceUrl?: string;
				updated: string;
			};
			coverUrl: string | null;
		};
	} = $props();

	const article = $derived(data.article);
	const coverUrl = $derived(data.coverUrl);
	const slug = $derived($page.params.slug ?? '');
	const articlePath = $derived(`/articles/${slug}`);
</script>

<SeoHead
	title={`${article.title} | ${HOOMBAN_BRAND_NAME}`}
	description={article.excerpt}
	path={articlePath}
	type="article"
	image={coverUrl || undefined}
	jsonLd={[
		articleJsonLd({
			title: article.title,
			description: article.excerpt,
			url: absoluteUrl(articlePath),
			datePublished: article.updated,
			dateModified: article.updated,
			authorName: article.authorName,
			image: coverUrl || undefined
		}),
		breadcrumbJsonLd([
			{ name: 'خانه', path: '/' },
			{ name: 'مقالات', path: '/articles' },
			{ name: article.title, path: articlePath }
		])
	]}
/>

<div class="min-h-dvh bg-white text-foreground dark:bg-background">
	<header class="border-b border-border px-4 py-4 sm:px-6">
		<div class="page-container flex items-center justify-between gap-4">
			<a href="/" class="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80">
				<BrandLogo class="h-9 w-9" width={72} height={72} />
				<span class="font-bold">{HOOMBAN_BRAND_NAME}</span>
			</a>
			<Button href="/articles" variant="ghost" size="sm" class="gap-1.5">
				<ArrowRight class="h-4 w-4" />
				همه مقالات
			</Button>
		</div>
	</header>

	<article class="page-container px-4 py-10 sm:px-6 sm:py-14">
		<div class="mx-auto max-w-3xl">
			<p class="mb-3 text-sm text-muted-foreground">{article.authorName}</p>
			<h1 class="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{article.title}</h1>
			{#if article.excerpt}
				<p class="mt-4 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
			{/if}

			{#if coverUrl}
				<div class="mt-8 overflow-hidden rounded-2xl border border-border">
					<img
						src={coverUrl}
						alt=""
						class="aspect-[16/9] w-full object-cover"
						loading="eager"
						decoding="async"
					/>
				</div>
			{/if}

			<div class="prose prose-neutral mt-10 max-w-none dark:prose-invert">
				{#each article.content.split(/\n{2,}/).filter(Boolean) as paragraph, i (i)}
					<p class="mb-4 text-base leading-relaxed text-foreground/90">{paragraph}</p>
				{/each}
			</div>

			{#if article.sourceUrl}
				<p class="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
					منبع:
					<a
						href={article.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary underline-offset-4 transition-colors duration-200 hover:underline"
					>
						{article.sourceUrl}
					</a>
				</p>
			{/if}
		</div>
	</article>
</div>
