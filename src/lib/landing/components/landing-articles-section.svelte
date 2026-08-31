<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft } from '@lucide/svelte';
	import type { LandingArticle } from '$lib/landing/public-data';
	import LandingArticleCard from '$lib/landing/components/landing-article-card.svelte';
	import { cn } from '$lib/utils';

	const ROTATE_MS = 6000;

	let { articles = [] }: { articles?: LandingArticle[] } = $props();

	let visibleCount = $state(3);
	let windowIndex = $state(0);
	let paused = $state(false);

	const maxWindow = $derived(Math.max(0, articles.length - visibleCount));
	const canRotate = $derived(articles.length > visibleCount);
	const windowCount = $derived(canRotate ? maxWindow + 1 : 1);
	const trackWidthPercent = $derived((articles.length / visibleCount) * 100);
	const itemWidthPercent = $derived(articles.length > 0 ? 100 / articles.length : 100);
	const slideOffsetPercent = $derived(-windowIndex * itemWidthPercent);

	function advance() {
		if (!canRotate) return;
		windowIndex = (windowIndex + 1) % (maxWindow + 1);
	}

	function goToWindow(index: number) {
		windowIndex = index;
	}

	onMount(() => {
		const mqLg = window.matchMedia('(min-width: 1024px)');
		const mqMd = window.matchMedia('(min-width: 768px)');

		const updateVisibleCount = () => {
			const next = mqLg.matches ? 3 : mqMd.matches ? 2 : 1;
			if (next !== visibleCount) {
				visibleCount = next;
				windowIndex = 0;
			}
		};

		updateVisibleCount();
		mqLg.addEventListener('change', updateVisibleCount);
		mqMd.addEventListener('change', updateVisibleCount);

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		let intervalId: ReturnType<typeof setInterval> | undefined;

		const startRotation = () => {
			if (intervalId) clearInterval(intervalId);
			if (reducedMotion.matches) return;
			intervalId = setInterval(() => {
				if (!paused) advance();
			}, ROTATE_MS);
		};

		startRotation();
		reducedMotion.addEventListener('change', startRotation);

		return () => {
			mqLg.removeEventListener('change', updateVisibleCount);
			mqMd.removeEventListener('change', updateVisibleCount);
			reducedMotion.removeEventListener('change', startRotation);
			if (intervalId) clearInterval(intervalId);
		};
	});
</script>

<section
	id="articles"
	class="relative overflow-hidden bg-white px-4 py-16 text-foreground dark:bg-background sm:px-6 sm:py-20"
>
	<div class="page-container">
		<div class="mx-auto mb-10 max-w-2xl text-center">
			<h2 class="text-2xl font-bold tracking-tight sm:text-4xl">مجله سلامت روان</h2>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
				مطالب آموزشی و راهنمای مراقبت از سلامت روان — از تیم درمان هومبان
			</p>
		</div>

		{#if articles.length}
			<div
				role="region"
				aria-roledescription="carousel"
				aria-label="آخرین مقالات"
				onmouseenter={() => (paused = true)}
				onmouseleave={() => (paused = false)}
			>
				<!-- dir=ltr keeps slide math stable; card text stays RTL -->
				<div class="-mx-3 overflow-hidden" dir="ltr">
					<div
						class="flex will-change-transform transition-transform duration-700 ease-in-out motion-reduce:transition-none"
						style:width="{trackWidthPercent}%"
						style:transform="translate3d({slideOffsetPercent}%, 0, 0)"
					>
						{#each articles as article, i (article.id)}
							<div
								class="box-border shrink-0 px-3"
								style:width="{itemWidthPercent}%"
								aria-hidden={i < windowIndex || i >= windowIndex + visibleCount}
							>
								<LandingArticleCard {article} class="h-full" />
							</div>
						{/each}
					</div>
				</div>

				{#if canRotate}
					<div class="mt-6 flex justify-center gap-2" role="tablist" aria-label="اسلایدهای مقالات">
						{#each Array(windowCount) as _, i (i)}
							<button
								type="button"
								role="tab"
								aria-selected={windowIndex === i}
								aria-label="اسلاید {i + 1} از {windowCount}"
								class={cn(
									'h-2 rounded-full transition-all duration-300 ease-in-out',
									windowIndex === i
										? 'w-6 bg-primary'
										: 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
								)}
								onclick={() => goToWindow(i)}
							></button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="mt-10 text-center">
				<a
					href="/articles"
					class="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all duration-200 ease-in-out hover:border-primary/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
				>
					مشاهده همه مقالات
					<ArrowLeft class="h-4 w-4" aria-hidden="true" />
				</a>
			</div>
		{:else}
			<div
				class="rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center"
			>
				<p class="text-sm text-muted-foreground">به‌زودی مقالات جدید منتشر می‌شود.</p>
			</div>
		{/if}
	</div>
</section>
