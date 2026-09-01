<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import LandingNavbar from '$lib/components/ui/landing-navbar.svelte';
	import LandingHeroBanner from '$lib/components/ui/landing-hero-banner.svelte';
	import LandingScrollReveal from '$lib/components/ui/landing-scroll-reveal.svelte';
	import LandingFeaturesSection from '$lib/components/ui/landing-features-section.svelte';
	import Footer7 from '$lib/components/ui/footer-7.svelte';
	import type {
		LandingArticle,
		LandingDoctor,
		LandingService,
		LandingTestimonial
	} from '$lib/landing/public-data';
	import type { Component } from 'svelte';

	let {
		data
	}: {
		data: {
			connected: boolean;
			message: string;
			doctors: LandingDoctor[];
			services: LandingService[];
			testimonials: LandingTestimonial[];
			articles: LandingArticle[];
		};
	} = $props();

	let user = $derived(getUser());
	let heroSection = $state<HTMLElement | null>(null);
	let heroCollapseProgress = $state(0);
	let heroScrollVh = $state(95);

	const pageContentReveal = $derived(
		Math.min(1, Math.max(0, (heroCollapseProgress - 0.22) / 0.38))
	);

	const testimonials = $derived(data.testimonials);

	let DoctorsShowcase = $state<Component<{
		doctors: LandingDoctor[];
		testimonials: LandingTestimonial[];
		onBook?: (doctorId?: string) => void;
	}> | null>(null);
	let InfiniteMovingCards = $state<Component<{
		compact?: boolean;
		items: { quote: string; name: string; title: string }[];
	}> | null>(null);
	let LandingArticlesSection = $state<Component<{
		articles: LandingArticle[];
	}> | null>(null);

	function loadDoctorsShowcase() {
		if (DoctorsShowcase) return;
		void import('$lib/components/doctors-showcase.svelte').then((m) => {
			DoctorsShowcase = m.default;
		});
	}

	function loadTestimonials() {
		if (InfiniteMovingCards) return;
		void import('$lib/components/ui/infinite-moving-cards-demo.svelte').then((m) => {
			InfiniteMovingCards = m.default;
		});
	}

	function loadArticles() {
		if (LandingArticlesSection) return;
		void import('$lib/landing/components/landing-articles-section.svelte').then((m) => {
			LandingArticlesSection = m.default;
		});
	}

	$effect(() => {
		if (data.doctors.length > 0) loadDoctorsShowcase();
	});
</script>

<div class="min-h-dvh bg-white text-foreground dark:bg-background">
	<LandingHeroBanner
		bind:root={heroSection}
		bind:collapseProgress={heroCollapseProgress}
		bind:scrollVh={heroScrollVh}
	/>

	<LandingNavbar {user} heroSection={heroSection} />

	<div
		class="relative z-20 bg-white transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none dark:bg-background"
		style="margin-top: calc(-1 * {heroScrollVh}vh); opacity: {pageContentReveal}; transform: translateY({(1 - pageContentReveal) * 16}px); pointer-events: {pageContentReveal > 0.12 ? 'auto' : 'none'}"
	>
	<LandingScrollReveal onvisible={loadDoctorsShowcase}>
		<LandingFeaturesSection services={data.services} />
	</LandingScrollReveal>

	<LandingScrollReveal lazy={false} onvisible={loadDoctorsShowcase}>
		<section id="doctors" class="bg-white px-4 pt-20 pb-6 dark:bg-background sm:px-6 sm:pt-24 sm:pb-8">
			<div class="mx-auto mb-8 max-w-3xl text-center">
				<p class="mb-2 text-xs font-semibold tracking-wide text-primary sm:text-sm">تیم درمان</p>
				<h2 class="text-2xl font-bold tracking-tight sm:text-4xl">متخصصین هومبان</h2>
				<p class="mt-3 text-sm text-muted-foreground sm:text-base">
					روانشناسان و درمانگران کلینیک — انتخاب متخصص مناسب برای شما
				</p>
			</div>
			{#if data.doctors.length > 0}
				{#if DoctorsShowcase}
					<DoctorsShowcase
						doctors={data.doctors}
						testimonials={testimonials}
						onBook={(doctorId) =>
							goto(doctorId ? `/appointments/book?doctor=${doctorId}` : '/appointments/book')}
					/>
				{:else}
					<div class="flex min-h-[12rem] items-center justify-center text-sm text-muted-foreground">
						در حال بارگذاری متخصصین…
					</div>
				{/if}
			{:else}
				<div class="flex min-h-[12rem] items-center justify-center text-sm text-muted-foreground">
					{data.connected
						? 'فعلاً متخصص فعالی برای نمایش ثبت نشده است.'
						: 'برای نمایش متخصصین، اتصال به سرور برقرار نیست.'}
				</div>
			{/if}
		</section>
	</LandingScrollReveal>

	{#if testimonials.length}
		<LandingScrollReveal onvisible={loadTestimonials}>
			<section
				id="testimonials"
				class="overflow-hidden bg-white px-4 pb-12 pt-2 dark:bg-background sm:px-6 sm:pb-16 sm:pt-4"
			>
				<div class="mx-auto mb-5 max-w-2xl text-center">
					<p class="mb-1.5 text-xs font-semibold tracking-wide text-primary sm:text-sm">بازخوردها</p>
					<h2 class="text-xl font-bold tracking-tight sm:text-3xl">نظر مراجعان</h2>
					<p class="mt-1.5 text-sm text-muted-foreground">از بازخوردهای منتشرشده در سایت هومبان</p>
				</div>
				{#if InfiniteMovingCards}
					<InfiniteMovingCards
						compact
						items={testimonials.map((tm) => ({
							quote: tm.body,
							name: tm.author,
							title: tm.source || 'مراجع هومبان'
						}))}
					/>
				{/if}
			</section>
		</LandingScrollReveal>
	{/if}

	<LandingScrollReveal onvisible={loadArticles}>
		{#if LandingArticlesSection}
			<LandingArticlesSection articles={data.articles} />
		{:else}
			<section
				id="articles"
				class="flex min-h-[12rem] items-center justify-center bg-white px-4 py-16 text-sm text-muted-foreground dark:bg-background"
			>
				در حال بارگذاری مقالات…
			</section>
		{/if}
	</LandingScrollReveal>

	<LandingScrollReveal>
		<Footer7 />
	</LandingScrollReveal>
	</div>
</div>
