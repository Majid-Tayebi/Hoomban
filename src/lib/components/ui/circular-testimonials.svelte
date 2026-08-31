<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { ArrowLeft, ArrowRight } from '@lucide/svelte';

	export type CircularSlide = {
		quote: string;
		name: string;
		designation: string;
		src: string;
	};

	type Colors = {
		name?: string;
		designation?: string;
		testimony?: string;
		arrowBackground?: string;
		arrowForeground?: string;
		arrowHoverBackground?: string;
	};

	type FontSizes = {
		name?: string;
		designation?: string;
		quote?: string;
	};

	let {
		slides,
		autoplay = true,
		colors = {},
		fontSizes = {}
	}: {
		slides: CircularSlide[];
		autoplay?: boolean;
		colors?: Colors;
		fontSizes?: FontSizes;
	} = $props();

	const colorName = $derived(colors.name ?? 'hsl(var(--foreground))');
	const colorDesignation = $derived(colors.designation ?? 'hsl(var(--muted-foreground))');
	const colorTestimony = $derived(colors.testimony ?? 'hsl(var(--foreground) / 0.85)');
	const colorArrowBg = $derived(colors.arrowBackground ?? 'hsl(var(--primary))');
	const colorArrowFg = $derived(colors.arrowForeground ?? 'hsl(var(--primary-foreground))');
	const colorArrowHoverBg = $derived(colors.arrowHoverBackground ?? 'hsl(var(--accent-foreground))');
	const fontSizeName = $derived(fontSizes.name ?? '1.35rem');
	const fontSizeDesignation = $derived(fontSizes.designation ?? '0.95rem');
	const fontSizeQuote = $derived(fontSizes.quote ?? '1.05rem');

	let activeIndex = $state(0);
	let hoverPrev = $state(false);
	let hoverNext = $state(false);
	let containerWidth = $state(1200);
	let imageContainerEl = $state<HTMLDivElement | null>(null);
	let autoplayTimer: ReturnType<typeof setInterval> | undefined;

	const count = $derived(Math.max(slides.length, 1));
	const active = $derived(slides[activeIndex] ?? slides[0]);

	function calculateGap(width: number) {
		const minWidth = 1024;
		const maxWidth = 1456;
		const minGap = 60;
		const maxGap = 86;
		if (width <= minWidth) return minGap;
		if (width >= maxWidth) return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
		return minGap + ((maxGap - minGap) * (width - minWidth)) / (maxWidth - minWidth);
	}

	function getImageStyle(index: number): string {
		if (!slides.length) return '';
		const gap = calculateGap(containerWidth);
		const maxStickUp = gap * 0.8;
		const isActive = index === activeIndex;
		const isLeft = (activeIndex - 1 + count) % count === index;
		const isRight = (activeIndex + 1) % count === index;

		if (isActive) {
			return `z-index:3;opacity:1;pointer-events:auto;transform:translateX(0) translateY(0) scale(1) rotateY(0deg);`;
		}
		if (isLeft) {
			return `z-index:2;opacity:1;pointer-events:auto;transform:translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(15deg);`;
		}
		if (isRight) {
			return `z-index:2;opacity:1;pointer-events:auto;transform:translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(-15deg);`;
		}
		return `z-index:1;opacity:0;pointer-events:none;transform:translateX(0) scale(0.7);`;
	}

	function resetAutoplay() {
		if (autoplayTimer) clearInterval(autoplayTimer);
		if (!autoplay || slides.length <= 1) return;
		autoplayTimer = setInterval(() => {
			activeIndex = (activeIndex + 1) % count;
		}, 5000);
	}

	function handleNext() {
		if (slides.length <= 1) return;
		activeIndex = (activeIndex + 1) % count;
		resetAutoplay();
	}

	function handlePrev() {
		if (slides.length <= 1) return;
		activeIndex = (activeIndex - 1 + count) % count;
		resetAutoplay();
	}

	function onResize() {
		if (imageContainerEl) containerWidth = imageContainerEl.offsetWidth;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') handlePrev();
		if (e.key === 'ArrowRight') handleNext();
	}

	onMount(() => {
		onResize();
		window.addEventListener('resize', onResize);
		window.addEventListener('keydown', onKeydown);
		resetAutoplay();
		return () => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('keydown', onKeydown);
			if (autoplayTimer) clearInterval(autoplayTimer);
		};
	});

	$effect(() => {
		void slides.length;
		if (activeIndex >= slides.length) activeIndex = 0;
		resetAutoplay();
	});
</script>

{#if slides.length === 0}
	<p class="py-10 text-center text-sm text-muted-foreground">محتوایی برای نمایش نیست.</p>
{:else}
	<div class="mx-auto w-full max-w-4xl px-2 sm:px-4">
		<div class="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
			<div
				bind:this={imageContainerEl}
				class="relative mx-auto h-72 w-full max-w-md perspective-[1000px] sm:h-80 md:max-w-none md:h-96"
			>
				{#each slides as slide, index (slide.src + slide.name)}
					<img
						src={slide.src}
						alt={slide.name}
						class="absolute inset-0 h-full w-full rounded-3xl object-cover shadow-2xl transition-all duration-700 ease-[cubic-bezier(.4,2,.3,1)]"
						style={getImageStyle(index)}
						loading={index === 0 ? 'eager' : 'lazy'}
					/>
				{/each}
			</div>

			<div class="flex flex-col justify-between">
				{#key activeIndex}
					<div in:fly={{ y: 16, duration: 280 }} out:fade={{ duration: 180 }}>
						<h3 class="mb-1 font-bold" style={`color:${colorName};font-size:${fontSizeName}`}>
							{active.name}
						</h3>
						<p class="mb-5" style={`color:${colorDesignation};font-size:${fontSizeDesignation}`}>
							{active.designation}
						</p>
						<p
							class="leading-8"
							style={`color:${colorTestimony};font-size:${fontSizeQuote}`}
						>
							{active.quote}
						</p>
					</div>
				{/key}

				<div class="mt-8 flex items-center gap-4 md:mt-0">
					<button
						type="button"
						class="flex h-11 w-11 items-center justify-center rounded-full border-0 transition-colors duration-300"
						style={`background-color:${hoverPrev ? colorArrowHoverBg : colorArrowBg};color:${colorArrowFg}`}
						onmouseenter={() => (hoverPrev = true)}
						onmouseleave={() => (hoverPrev = false)}
						onclick={handlePrev}
						aria-label="متخصص قبلی"
					>
						<ArrowRight class="h-5 w-5" />
					</button>
					<button
						type="button"
						class="flex h-11 w-11 items-center justify-center rounded-full border-0 transition-colors duration-300"
						style={`background-color:${hoverNext ? colorArrowHoverBg : colorArrowBg};color:${colorArrowFg}`}
						onmouseenter={() => (hoverNext = true)}
						onmouseleave={() => (hoverNext = false)}
						onclick={handleNext}
						aria-label="متخصص بعدی"
					>
						<ArrowLeft class="h-5 w-5" />
					</button>
					<div class="mr-auto flex gap-1.5">
						{#each slides as _, i}
							<button
								type="button"
								class="h-2 rounded-full transition-all {i === activeIndex
									? 'w-6 bg-primary'
									: 'w-2 bg-muted-foreground/30'}"
								aria-label={`اسلاید ${i + 1}`}
								onclick={() => {
									activeIndex = i;
									resetAutoplay();
								}}
							></button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
