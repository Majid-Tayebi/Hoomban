<script lang="ts">
	import { onMount } from 'svelte';
	import type { ChartType } from 'chart.js';
	import {
		HERO_BRAIN_FALLBACK,
		HERO_BRAIN_PRELOAD,
		HERO_BRAIN_WEBP_SRCSET
	} from '$lib/brand/logo';
	import TypewriterEffect from '$lib/components/ui/typewriter-effect.svelte';
	import FlowButton from '$lib/components/ui/flow-button.svelte';
	import { Calendar, Lock, Shield, UserCheck, Video } from '@lucide/svelte';

	let { root = $bindable<HTMLElement | null>(null) }: { root?: HTMLElement | null } = $props();

	const trustItems = [
		{
			icon: Lock,
			label: 'محرمانگی',
			ring: 'from-violet-400 via-fuchsia-400 to-violet-500',
			glow: 'bg-violet-400/45',
			iconBg: 'from-violet-500 to-fuchsia-500',
			text: 'text-violet-700 dark:text-violet-200'
		},
		{
			icon: Shield,
			label: 'درمان علمی',
			ring: 'from-sky-400 via-cyan-400 to-primary',
			glow: 'bg-sky-400/45',
			iconBg: 'from-sky-500 to-cyan-500',
			text: 'text-sky-800 dark:text-sky-200'
		},
		{
			icon: UserCheck,
			label: 'تیم همدل',
			ring: 'from-amber-400 via-orange-300 to-rose-400',
			glow: 'bg-amber-400/40',
			iconBg: 'from-amber-500 to-orange-400',
			text: 'text-amber-800 dark:text-amber-200'
		}
	];

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
	const opacity = $derived(Math.max(0, 1 - progress));
	const blurPx = $derived(progress * 8);
	const radiusPx = $derived(Math.round(progress * 24));

	function resolveScrollVh() {
		const w = window.innerWidth;
		if (w < 640) return 10;
		if (w < 1024) return 22;
		return 32;
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

<svelte:head>
	<link
		rel="preload"
		as="image"
		href={HERO_BRAIN_PRELOAD}
		type="image/webp"
		fetchpriority="high"
	/>
</svelte:head>

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

				<ul
					class="mt-4 flex flex-wrap items-center justify-center gap-3 sm:mt-5 sm:gap-4"
					aria-label="مزایای کلینیک هومبان"
				>
					{#each trustItems as item, i (item.label)}
						<li
							class="group relative motion-safe:animate-float"
							style:animation-delay="{i * 0.65}s"
						>
							<span
								class="absolute -inset-1 rounded-2xl {item.glow} opacity-60 blur-lg transition-opacity duration-300 group-hover:opacity-90"
								aria-hidden="true"
							></span>
							<div
								class="relative rounded-2xl bg-gradient-to-br {item.ring} p-px shadow-lg shadow-primary/10 transition-all duration-300 ease-in-out group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-primary/15"
							>
								<div
									class="flex items-center gap-2 rounded-[0.9rem] bg-white/90 px-3 py-1.5 backdrop-blur-md dark:bg-background/90 sm:gap-2.5 sm:px-3.5 sm:py-2"
								>
									<span
										class="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br {item.iconBg} text-white shadow-md ring-2 ring-white/60 dark:ring-white/10"
									>
										<item.icon class="h-3.5 w-3.5 drop-shadow-sm" aria-hidden="true" />
									</span>
									<span class="text-xs font-semibold {item.text} sm:text-sm">{item.label}</span>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>

			<div
				class="relative z-10 mt-auto flex min-h-0 flex-1 items-end justify-center px-2 pb-2 pt-2 sm:flex-none sm:pt-0"
			>
				<picture>
					<source
						type="image/webp"
						srcset={HERO_BRAIN_WEBP_SRCSET}
						sizes="(max-width: 640px) 88vw, (max-width: 1024px) 72vw, 60vw"
					/>
					<img
						src={HERO_BRAIN_FALLBACK}
						alt="نمایش علمی فعالیت‌های مغزی"
						class="pointer-events-none h-auto max-h-full w-[min(88vw,18rem)] object-contain object-bottom sm:w-[min(82vw,22rem)] md:w-[min(72vw,26rem)] lg:w-[min(60vw,30rem)]"
						width="480"
						height="480"
						decoding="async"
						fetchpriority="high"
					/>
				</picture>
			</div>
		</div>
	</div>
</section>
