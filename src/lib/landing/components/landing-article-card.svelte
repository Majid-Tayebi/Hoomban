<script lang="ts">
	import { FileText } from '@lucide/svelte';
	import type { LandingArticle } from '$lib/landing/public-data';
	import { getLandingArticleCoverUrl } from '$lib/landing/public-data';
	import { cn } from '$lib/utils';

	let {
		article,
		class: className = ''
	}: {
		article: LandingArticle;
		class?: string;
	} = $props();

	const cover = $derived(getLandingArticleCoverUrl(article));

	function authorInitials(name: string): string {
		return name
			.split(/\s+/)
			.filter(Boolean)
			.map((w) => w.charAt(0))
			.slice(0, 2)
			.join('');
	}
</script>

<a
	href="/articles/{article.slug}"
	class={cn(
		'group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
		className
	)}
>
	<div class="relative aspect-[16/10] overflow-hidden bg-muted">
		{#if cover}
			<img
				src={cover}
				alt=""
				class="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-[1.03]"
				loading="lazy"
				decoding="async"
			/>
		{:else}
			<div
				class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-muted to-muted/80"
			>
				<FileText class="h-12 w-12 text-primary/50" aria-hidden="true" />
			</div>
		{/if}
	</div>

	<div class="flex flex-1 flex-col p-5 sm:p-6">
		<div class="mb-4 flex items-center gap-2.5">
			<span
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
				aria-hidden="true"
			>
				{authorInitials(article.authorName)}
			</span>
			<span class="text-sm text-muted-foreground">{article.authorName}</span>
		</div>

		<h3
			class="text-lg font-bold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary sm:text-xl"
		>
			{article.title}
		</h3>

		{#if article.excerpt}
			<p class="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
				{article.excerpt}
			</p>
		{/if}
	</div>
</a>
