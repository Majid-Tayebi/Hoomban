<script module lang="ts">
	export type FullpageSlide = {
		id: string;
		kind?: 'hero' | 'services' | 'doctors' | 'map' | 'feature' | 'cta';
		eyebrow?: string;
		title: string;
		description?: string;
		ctaLabel?: string;
		stats?: { n: string; l: string }[];
		image?: string;
		mapUrl?: string;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import Button from '$lib/components/ui/button.svelte';
	import CardHoverEffect, { type HoverEffectItem } from '$lib/components/ui/card-hover-effect.svelte';
	import DoctorsShowcase from '$lib/components/doctors-showcase.svelte';
	import type { LandingDoctor } from '$lib/landing/public-data';
	import { ChevronDown } from '@lucide/svelte';

	type DoctorInput = {
		id: string;
		name: string;
		specialty: string;
		bio: string;
		visitFee: number;
		slotDuration: number;
		photo?: string;
	};

	const DEFAULT_SLIDES: FullpageSlide[] = [
		{
			id: 'brand',
			kind: 'hero',
			eyebrow: 'هومبان',
			title: 'روان‌درمانی، روانکاوی و نوروتراپی',
			description:
				'از RTMS و TDCS تا نوروفیدبک و فتوبیومادولیشن — مسیر درمان در فضایی امن با تیم متخصصین هومبان در اراک.',
			ctaLabel: 'رزرو نوبت',
			stats: [
				{ n: '۱۲۰۰+', l: 'درخواست مشاوره' },
				{ n: '۱۲', l: 'متخصص فعال' }
			],
			image:
				'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=900&auto=format&fit=crop'
		},
		{
			id: 'services',
			kind: 'services',
			eyebrow: 'خدمات',
			title: 'خدمات تخصصی هومبان',
			description: 'مرور خدمات کلینیک — بدون نمایش قیمت در این بخش'
		},
		{
			id: 'doctors',
			kind: 'doctors',
			title: 'متخصصین هومبان',
			description: 'تیم درمان · روان‌درمانی، روانکاوی و نوروتراپی'
		},
		{
			id: 'location',
			kind: 'map',
			eyebrow: 'موقعیت',
			title: 'کلینیک روانشناسی هومبان',
			description: 'مشاهده آدرس کلینیک روی نقشه بلد',
			mapUrl: 'https://balad.ir/embed?p=PnDkSl8d4NzoLm'
		},
		{
			id: 'start',
			kind: 'cta',
			eyebrow: 'شروع درمان',
			title: 'رزرو نوبت در کلینیک هومبان',
			description: 'همین امروز مسیر مراقبت روان خود را با تیم هومبان آغاز کنید.',
			ctaLabel: 'رزرو نوبت'
		}
	];

	const HEIGHT_CLASSES: Record<number, string> = {
		1: 'h-[100vh]',
		2: 'h-[200vh]',
		3: 'h-[300vh]',
		4: 'h-[400vh]',
		5: 'h-[500vh]',
		6: 'h-[600vh]',
		7: 'h-[700vh]',
		8: 'h-[800vh]'
	};

	let {
		slides = DEFAULT_SLIDES,
		serviceItems = [],
		doctors = [],
		onCta,
		root = $bindable<HTMLElement | null>(null),
		class: className = ''
	}: {
		slides?: FullpageSlide[];
		serviceItems?: HoverEffectItem[];
		doctors?: DoctorInput[];
		onCta?: () => void;
		root?: HTMLElement | null;
		class?: string;
	} = $props();

	let activeIndex = $state(0);

	const slideCount = $derived(slides.length);
	const landingDoctors = $derived.by((): LandingDoctor[] =>
		doctors.map((d) => ({ ...d, updated: '' }))
	);
	const heightClass = $derived(
		HEIGHT_CLASSES[slideCount] ?? `h-[${Math.min(Math.max(slideCount, 1), 12) * 100}vh]`
	);
	const isLastSlide = $derived(activeIndex >= slideCount - 1);

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function updateActiveIndex() {
		if (!root || slideCount < 1) return;
		const totalScrollable = root.offsetHeight - window.innerHeight;
		if (totalScrollable <= 0) {
			activeIndex = 0;
			return;
		}
		const rect = root.getBoundingClientRect();
		const progress = clamp(-rect.top / totalScrollable, 0, 1);
		activeIndex = clamp(Math.round(progress * (slideCount - 1)), 0, slideCount - 1);
	}

	function handleCta() {
		onCta?.();
	}

	function scrollToSlide(index: number) {
		if (!root || slideCount < 1) return;
		const totalScrollable = root.offsetHeight - window.innerHeight;
		if (totalScrollable <= 0) {
			activeIndex = index;
			return;
		}
		const progress = slideCount <= 1 ? 0 : index / (slideCount - 1);
		window.scrollTo({ top: root.offsetTop + progress * totalScrollable, behavior: 'smooth' });
	}

	$effect(() => {
		updateActiveIndex();
	});
</script>

<svelte:window onscroll={updateActiveIndex} onresize={updateActiveIndex} />

<section
	bind:this={root}
	class={cn('relative', heightClass, className)}
	aria-label="معرفی هومبان"
	dir="rtl"
>
	<div class="sticky top-0 h-dvh overflow-hidden">
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border)/0.45)_1px,transparent_0)] bg-[length:28px_28px]"
			aria-hidden="true"
		></div>

		{#each slides as slide, i (slide.id)}
			{@const isActive = i === activeIndex}
			{@const kind = slide.kind ?? 'feature'}
			{@const circleOnStart = i % 2 === 1}
			<div
				class={cn(
					'absolute inset-0 flex flex-col overflow-y-auto transition-all duration-500 ease-in-out',
					kind === 'doctors' ? 'pt-[5.75rem] sm:pt-[6rem]' : 'pt-[5.25rem] sm:pt-[5.75rem]',
					isActive
						? 'pointer-events-auto translate-y-0 opacity-100'
						: 'pointer-events-none translate-y-6 opacity-0'
				)}
				aria-hidden={!isActive}
			>
				<div
					class={cn(
						'flex min-h-0 flex-1 pb-10 sm:pb-14',
						kind === 'doctors' ? 'items-start pt-1' : 'items-center pb-12 sm:pb-16'
					)}
				>
					{#if kind === 'hero'}
						<div
							class="page-container relative grid w-full items-center gap-7 sm:gap-8 lg:grid-cols-2 lg:gap-12"
						>
							<div class={cn('order-1 z-10 max-w-xl', circleOnStart ? 'lg:order-2' : 'lg:order-1')}>
								{#if slide.eyebrow}
									<p class="mb-3 text-sm font-semibold tracking-wide text-primary sm:text-base">
										{slide.eyebrow}
									</p>
								{/if}
								<h2
									class="text-3xl font-extrabold leading-snug tracking-tight text-foreground sm:text-4xl md:text-5xl"
								>
									{slide.title}
								</h2>
								{#if slide.description}
									<p class="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
										{slide.description}
									</p>
								{/if}
								{#if slide.stats?.length}
									<div class="mt-6 flex flex-wrap gap-6 sm:gap-8">
										{#each slide.stats as stat (stat.l)}
											<div>
												<p class="text-2xl font-bold text-foreground sm:text-3xl">{stat.n}</p>
												<p class="mt-0.5 text-xs text-muted-foreground sm:text-sm">{stat.l}</p>
											</div>
										{/each}
									</div>
								{/if}
								{#if slide.ctaLabel}
									<div class="mt-7">
										<Button
											size="lg"
											class="h-12 rounded-full px-8 text-sm font-semibold shadow-sm"
											onclick={handleCta}
										>
											{slide.ctaLabel}
										</Button>
									</div>
								{/if}
							</div>
							<div
								class={cn(
									'order-2 flex justify-center',
									circleOnStart ? 'lg:order-1 lg:justify-start' : 'lg:order-2 lg:justify-end'
								)}
							>
								<div
									class="relative aspect-square w-[min(68vw,16rem)] overflow-hidden rounded-full bg-gradient-to-br from-secondary/90 via-secondary/70 to-accent/60 shadow-[0_0_80px_-20px_hsl(var(--primary)/0.35)] sm:w-[min(60vw,20rem)] md:w-[22rem] lg:w-[26rem]"
								>
									{#if slide.image}
										<img
											src={slide.image}
											alt=""
											class="h-full w-full object-cover opacity-90"
											loading="lazy"
											decoding="async"
										/>
									{/if}
								</div>
							</div>
						</div>
					{:else if kind === 'services'}
						<div class="page-container w-full">
							<div class="mb-6 max-w-2xl sm:mb-8">
								{#if slide.eyebrow}
									<p class="mb-2 text-sm font-semibold tracking-wide text-primary">{slide.eyebrow}</p>
								{/if}
								<h2 class="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
									{slide.title}
								</h2>
								{#if slide.description}
									<p class="mt-2 text-sm text-muted-foreground sm:text-base">{slide.description}</p>
								{/if}
							</div>
							{#if serviceItems.length}
								<CardHoverEffect items={serviceItems.slice(0, 6)} />
							{:else}
								<p class="text-sm text-muted-foreground">در حال بارگذاری خدمات...</p>
							{/if}
						</div>
					{:else if kind === 'doctors'}
						<div class="page-container w-full">
							<header class="mb-5 max-w-xl sm:mb-6">
								<h2 class="text-xl font-bold leading-snug tracking-tight sm:text-2xl md:text-3xl">
									{slide.title}
								</h2>
								{#if slide.description}
									<p class="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
										{slide.description}
									</p>
								{/if}
							</header>
							{#if landingDoctors.length}
								<DoctorsShowcase doctors={landingDoctors} />
							{:else}
								<p class="text-sm text-muted-foreground">در حال بارگذاری متخصصین...</p>
							{/if}
						</div>
					{:else if kind === 'map'}
						<div
							class="page-container relative grid w-full items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-14"
						>
							<div
								class={cn('order-1 z-10 max-w-xl', circleOnStart ? 'lg:order-2' : 'lg:order-1')}
							>
								{#if slide.eyebrow}
									<p class="mb-3 text-sm font-semibold tracking-wide text-primary sm:text-base">
										{slide.eyebrow}
									</p>
								{/if}
								<h2
									class="text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-tight"
								>
									{slide.title}
								</h2>
								{#if slide.description}
									<p class="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
										{slide.description}
									</p>
								{/if}
							</div>
							<div
								class={cn(
									'order-2 flex justify-center',
									circleOnStart ? 'lg:order-1 lg:justify-start' : 'lg:order-2 lg:justify-end'
								)}
							>
								<div
									class="relative w-[min(84vw,18rem)] sm:w-[min(72vw,22rem)] md:w-[24rem] lg:w-[min(42vw,28rem)]"
								>
									<div
										class="absolute inset-[-10%] rounded-full bg-primary/10 blur-3xl"
										aria-hidden="true"
									></div>
									<div
										class="relative aspect-square overflow-hidden rounded-full shadow-[0_0_80px_-24px_hsl(var(--primary)/0.28)] [mask-image:radial-gradient(circle,black_58%,transparent_76%)]"
									>
										<iframe
											src={slide.mapUrl ?? 'https://balad.ir/embed?p=PnDkSl8d4NzoLm'}
											title="مشاهده «کلینیک روانشناسی هومبان» روی نقشه بلد"
											class="pointer-events-auto absolute inset-0 h-[118%] w-[118%] -translate-x-[9%] -translate-y-[9%] border-0"
											allowfullscreen
											loading="lazy"
											tabindex="0"
										></iframe>
									</div>
									<div
										class="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_50%,transparent_48%,hsl(var(--background)/0.88)_72%)] sm:bg-[radial-gradient(circle,transparent_52%,hsl(var(--background)/0.9)_74%)]"
										aria-hidden="true"
									></div>
								</div>
							</div>
						</div>
					{:else if kind === 'cta'}
						<div class="page-container w-full max-w-2xl text-center">
							{#if slide.eyebrow}
								<p class="mb-3 text-sm font-semibold tracking-wide text-primary">{slide.eyebrow}</p>
							{/if}
							<h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
								{slide.title}
							</h2>
							{#if slide.description}
								<p class="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
									{slide.description}
								</p>
							{/if}
							{#if slide.ctaLabel}
								<div class="mt-8">
									<Button
										size="lg"
										class="h-12 rounded-full px-10 text-sm font-semibold shadow-sm"
										onclick={handleCta}
									>
										{slide.ctaLabel}
									</Button>
								</div>
							{/if}
						</div>
					{:else}
						<div class="page-container w-full max-w-3xl">
							{#if slide.eyebrow}
								<p class="mb-3 text-sm font-semibold tracking-wide text-primary sm:text-base">
									{slide.eyebrow}
								</p>
							{/if}
							<h2 class="text-3xl font-extrabold leading-snug tracking-tight sm:text-4xl md:text-5xl">
								{slide.title}
							</h2>
							{#if slide.description}
								<p class="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
									{slide.description}
								</p>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}

		<nav
			class="pointer-events-auto absolute start-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3.5 md:flex lg:start-6"
			aria-label="اسلایدهای معرفی"
		>
			{#each slides as s, i (s.id)}
				<button
					type="button"
					class="relative flex h-4 w-4 items-center justify-center rounded-full transition-all duration-300"
					aria-label="رفتن به اسلاید {i + 1}"
					aria-current={i === activeIndex ? 'step' : undefined}
					onclick={() => scrollToSlide(i)}
				>
					{#if i === activeIndex}
						<span class="absolute inset-0 rounded-full border border-primary/80"></span>
						<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
					{:else}
						<span
							class="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 transition-colors hover:bg-muted-foreground/50"
						></span>
					{/if}
				</button>
			{/each}
		</nav>

		<nav
			class="pointer-events-auto absolute inset-x-0 bottom-14 z-20 flex justify-center gap-2.5 md:hidden"
			aria-label="اسلایدهای معرفی"
		>
			{#each slides as s, i (s.id)}
				<button
					type="button"
					class="relative flex h-3.5 w-3.5 items-center justify-center rounded-full"
					aria-label="رفتن به اسلاید {i + 1}"
					aria-current={i === activeIndex ? 'step' : undefined}
					onclick={() => scrollToSlide(i)}
				>
					{#if i === activeIndex}
						<span class="absolute inset-0 rounded-full border border-primary/80"></span>
						<span class="h-1 w-1 rounded-full bg-primary"></span>
					{:else}
						<span class="h-1 w-1 rounded-full bg-muted-foreground/30"></span>
					{/if}
				</button>
			{/each}
		</nav>

		{#if !isLastSlide}
			<div
				class="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center sm:bottom-6"
				aria-hidden="true"
			>
				<div class="flex flex-col items-center gap-0 md:hidden">
					<ChevronDown class="h-3.5 w-3.5 -mb-1.5 text-muted-foreground/40" />
					<ChevronDown class="h-3.5 w-3.5 animate-bounce text-muted-foreground/65" />
				</div>
				<div class="hidden flex-col items-center gap-2 md:flex">
					<div
						class="relative flex h-10 w-[22px] items-start justify-center rounded-full border border-muted-foreground/35 pt-2"
					>
						<div class="h-1.5 w-0.5 animate-bounce rounded-full bg-muted-foreground/55"></div>
					</div>
					<div class="flex flex-col items-center -space-y-2.5">
						<ChevronDown class="h-3 w-3 text-muted-foreground/40" />
						<ChevronDown class="h-3 w-3 animate-bounce text-muted-foreground/65" />
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>
