<script lang="ts">
	import {
		HERO_BRAIN_FALLBACK,
		HERO_BRAIN_PRELOAD,
		HERO_BRAIN_WEBP_SRCSET
	} from '$lib/brand/logo';
	import TypewriterEffect from '$lib/components/ui/typewriter-effect.svelte';
	import FlowButton from '$lib/components/ui/flow-button.svelte';
	import { Calendar, ClipboardList, Lock, Shield, UserCheck, HeartHandshake } from '@lucide/svelte';

	let {
		root = $bindable<HTMLElement | null>(null),
		collapseProgress = $bindable(0),
		scrollVh = $bindable(95)
	}: {
		root?: HTMLElement | null;
		collapseProgress?: number;
		scrollVh?: number;
	} = $props();

	const trustPills = [
		{ icon: Lock, label: 'محرمانگی' },
		{ icon: Shield, label: 'درمان علمی' },
		{ icon: UserCheck, label: 'تیم همدل' },
		{ icon: HeartHandshake, label: 'همراهی مستمر' }
	];

	const heroShellClass = 'bg-white dark:bg-background';

	const heroLightGradientClass =
		'pointer-events-none absolute inset-x-0 top-0 z-0 h-[46%] bg-gradient-to-b from-azure-mist-50 via-background/70 to-transparent dark:hidden';

	const heroDarkGradientClass =
		'pointer-events-none absolute inset-x-0 top-0 z-0 h-[46%] bg-gradient-to-b from-cerulean-950/20 via-background/80 to-transparent hidden dark:block';

	let progress = $state(0);

	const headlineWords = [
		{ text: 'روان‌درمانی،' },
		{ text: 'روانکاوی' },
		{ text: 'و' },
		{ text: 'نوروتراپی', className: 'text-primary dark:text-cerulean-300' }
	];

	function easeOutQuart(t: number): number {
		return 1 - Math.pow(1 - t, 4);
	}

	const easedProgress = $derived(easeOutQuart(progress));

	/** Ellipse mask — inspired by oleumbudget.com pinned hero collapse */
	const maskWidth = $derived(`${100 - easedProgress * 96}dvw`);
	const maskHeight = $derived(`${100 - easedProgress * 93}dvh`);
	const maskRadius = $derived(
		easedProgress < 0.04 ? '1.5rem' : `${Math.min(50, 6 + easedProgress * 44)}%`
	);
	const shellOpacity = $derived(
		easedProgress < 0.42 ? 1 : Math.max(0, 1 - (easedProgress - 0.42) / 0.35)
	);

	function resolveScrollVh() {
		const w = window.innerWidth;
		if (w < 640) return 55;
		if (w < 1024) return 75;
		return 95;
	}

	function updateScrollProgress() {
		if (!root) return;
		const scrollRange = root.offsetHeight - window.innerHeight;
		if (scrollRange <= 0) {
			progress = 0;
			collapseProgress = 0;
			return;
		}
		const scrolled = Math.min(Math.max(-root.getBoundingClientRect().top, 0), scrollRange);
		progress = scrolled / scrollRange;
		collapseProgress = progress;
	}

	function updateViewportMetrics() {
		scrollVh = resolveScrollVh();
		updateScrollProgress();
	}

	let scrollRaf = 0;
	function scheduleScrollProgress() {
		if (scrollRaf) return;
		scrollRaf = requestAnimationFrame(() => {
			scrollRaf = 0;
			updateScrollProgress();
		});
	}

	$effect(() => {
		root;
		updateViewportMetrics();
		return () => {
			if (scrollRaf) cancelAnimationFrame(scrollRaf);
		};
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

<svelte:window onscroll={scheduleScrollProgress} onresize={updateViewportMetrics} />

<section
	bind:this={root}
	class="relative {heroShellClass}"
	style="height: calc(100dvh + {scrollVh}vh)"
	aria-label="معرفی هومبان"
>
	<div
		class="sticky top-0 z-30 h-dvh w-full {heroShellClass}"
		style="pointer-events: {shellOpacity < 0.05 ? 'none' : 'auto'}; opacity: {shellOpacity};"
	>
		<div
			class="absolute left-1/2 top-1/2 overflow-hidden {heroShellClass} shadow-sm"
			style="
				width: {maskWidth};
				height: {maskHeight};
				border-radius: {maskRadius};
				transform: translate(-50%, -50%);
				will-change: width, height, border-radius;
			"
		>
			<!-- Fixed viewport canvas — centered so mask clips edges inward, not content sideways -->
			<div
				class="absolute left-1/2 top-1/2 flex h-[100dvh] w-[100dvw] -translate-x-1/2 -translate-y-1/2 flex-col {heroShellClass}"
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
							href="/tests"
							text="آزمون‌ها"
							icon={ClipboardList}
							variant="secondary"
							class="w-full border-border bg-secondary/80 text-secondary-foreground backdrop-blur-sm hover:text-secondary-foreground sm:w-auto"
						/>
					</div>

					<ul
						class="mt-5 flex max-w-lg flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-2.5"
						aria-label="مزایای کلینیک هومبان"
					>
						{#each trustPills as item (item.label)}
							<li>
								<span
									class="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors duration-200 ease-in-out hover:border-border hover:bg-muted/40 hover:text-foreground sm:text-xs"
								>
									<item.icon class="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
									{item.label}
								</span>
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
	</div>
</section>
