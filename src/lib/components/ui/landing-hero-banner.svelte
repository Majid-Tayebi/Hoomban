<script lang="ts">
	import { Calendar, Video } from '@lucide/svelte';
	import TypewriterEffect from '$lib/components/ui/typewriter-effect.svelte';
	import FlowButton from '$lib/components/ui/flow-button.svelte';

	let { root = $bindable<HTMLElement | null>(null) }: { root?: HTMLElement | null } = $props();

	const HERO_IMAGE = '/images/landing-hero-brain.png?v=7';

	const heroShellClass = 'bg-white dark:bg-background';

	const heroLightGradientClass =
		'pointer-events-none absolute inset-x-0 top-0 z-0 h-[46%] bg-gradient-to-b from-azure-mist-50 via-background/70 to-transparent dark:hidden';

	const heroDarkGradientClass =
		'pointer-events-none absolute inset-x-0 top-0 z-0 h-[46%] bg-gradient-to-b from-cerulean-950/20 via-background/80 to-transparent hidden dark:block';

	let scrollVh = $state(65);
	let progress = $state(0);

	const headlineWords = [
		{ text: 'روان‌درمانی،' },
		{ text: 'روانکاوی' },
		{ text: 'و' },
		{ text: 'نوروتراپی', className: 'text-primary dark:text-cerulean-300' }
	];

	const scale = $derived(1 - progress * 0.2);
	const opacity = $derived(Math.max(0, 1 - progress * 1.1));
	const blurPx = $derived(progress * 8);
	const radiusPx = $derived(Math.round(progress * 24));

	function resolveScrollVh() {
		const w = window.innerWidth;
		if (w < 640) return 18;
		if (w < 1024) return 42;
		return 65;
	}

	function updateScrollProgress() {
		if (!root) return;
		const scrollRange = root.offsetHeight - window.innerHeight;
		if (scrollRange <= 0) {
			progress = 0;
			return;
		}
		const scrolled = Math.min(Math.max(-root.getBoundingClientRect().top, 0), scrollRange);
		progress = scrolled / scrollRange;
	}

	function updateViewportMetrics() {
		scrollVh = resolveScrollVh();
		updateScrollProgress();
	}

	$effect(() => {
		root;
		updateViewportMetrics();
	});
</script>

<svelte:window onscroll={updateScrollProgress} onresize={updateViewportMetrics} />

<section
	bind:this={root}
	class="relative {heroShellClass}"
	style="height: calc(100dvh + {scrollVh}vh)"
	aria-label="معرفی هومبان"
>
	<div
		class="sticky top-0 h-dvh w-full overflow-hidden {heroShellClass}"
		style="opacity: {opacity}; pointer-events: {opacity < 0.05 ? 'none' : 'auto'};"
	>
		<div
			class="relative flex h-full w-full flex-col origin-center {heroShellClass}"
			style="
				transform: scale({scale});
				opacity: {opacity};
				filter: blur({blurPx}px);
				border-radius: {radiusPx}px;
				will-change: transform, opacity, filter, border-radius;
			"
		>
			<div class={heroLightGradientClass} aria-hidden="true"></div>
			<div class={heroDarkGradientClass} aria-hidden="true"></div>

			<div
				class="relative z-10 flex shrink-0 flex-col items-center px-4 pt-20 text-center sm:px-6 sm:pt-28 md:pt-36 lg:pt-44"
			>
				<p class="mb-2 text-xs font-medium text-muted-foreground sm:mb-3 sm:text-sm">
					مسیر درمان از اینجا آغاز می‌شود
				</p>

				<TypewriterEffect
					words={headlineWords}
					class="my-0 justify-center text-xl text-foreground sm:text-2xl md:text-3xl lg:text-5xl"
					cursorClassName="bg-primary dark:bg-cerulean-400"
				/>

				<p class="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
					فضایی امن برای شروع یک گفتگو
				</p>

				<div
					class="mt-5 flex w-full max-w-sm flex-col gap-2.5 sm:mt-6 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3"
				>
					<FlowButton
						href="/appointments/book"
						text="رزرو نوبت"
						icon={Calendar}
						variant="primary"
						class="w-full sm:w-auto"
					/>
					<FlowButton
						href="/appointments/book?mode=online"
						text="مشاوره آنلاین"
						icon={Video}
						variant="secondary"
						class="w-full border-border bg-secondary/80 text-secondary-foreground backdrop-blur-sm hover:text-secondary-foreground sm:w-auto"
					/>
				</div>
			</div>

			<div
				class="relative z-10 mt-auto flex min-h-0 flex-1 items-end justify-center px-2 pb-2 sm:flex-none"
			>
				<img
					src={HERO_IMAGE}
					alt="نمایش علمی فعالیت‌های مغزی"
					class="pointer-events-none h-auto max-h-full w-[min(88vw,18rem)] object-contain object-bottom sm:w-[min(82vw,22rem)] md:w-[min(72vw,26rem)] lg:w-[min(60vw,30rem)]"
					decoding="async"
					fetchpriority="high"
				/>
			</div>
		</div>
	</div>
</section>
