<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import LandingNavbar from '$lib/components/ui/landing-navbar.svelte';
	import LandingHeroBanner from '$lib/components/ui/landing-hero-banner.svelte';
	import LandingScrollReveal from '$lib/components/ui/landing-scroll-reveal.svelte';
	import LandingFeaturesSection from '$lib/components/ui/landing-features-section.svelte';
	import BrandLogo from '$lib/components/brand-logo.svelte';
	import { HOOMBAN_BRAND_NAME } from '$lib/brand/logo';
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
	let LandingFaqSection = $state<Component | null>(null);
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

	function loadFaq() {
		if (LandingFaqSection) return;
		void import('$lib/components/ui/landing-faq-section.svelte').then((m) => {
			LandingFaqSection = m.default;
		});
	}

	function loadArticles() {
		if (LandingArticlesSection) return;
		void import('$lib/landing/components/landing-articles-section.svelte').then((m) => {
			LandingArticlesSection = m.default;
		});
	}
</script>

<div class="min-h-dvh bg-white text-foreground dark:bg-background">
	<LandingHeroBanner bind:root={heroSection} />

	<LandingNavbar {user} heroSection={heroSection} />

	<LandingScrollReveal onvisible={loadDoctorsShowcase}>
		<LandingFeaturesSection services={data.services} />
	</LandingScrollReveal>

	{#if data.doctors.length}
		<LandingScrollReveal onvisible={loadDoctorsShowcase}>
			<section id="doctors" class="bg-white px-4 pt-20 pb-6 dark:bg-background sm:px-6 sm:pt-24 sm:pb-8">
				<div class="mx-auto mb-8 max-w-3xl text-center">
					<p class="mb-2 text-xs font-semibold tracking-wide text-primary sm:text-sm">تیم درمان</p>
					<h2 class="text-2xl font-bold tracking-tight sm:text-4xl">متخصصین هومبان</h2>
					<p class="mt-3 text-sm text-muted-foreground sm:text-base">
						روانشناسان و درمانگران کلینیک — انتخاب متخصص مناسب برای شما
					</p>
				</div>
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
			</section>
		</LandingScrollReveal>
	{/if}

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

	<LandingScrollReveal onvisible={loadFaq}>
		{#if LandingFaqSection}
			<LandingFaqSection />
		{/if}
	</LandingScrollReveal>

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
		<footer
			class="border-t border-border bg-white px-4 py-12 text-foreground dark:bg-background sm:px-6 sm:py-14"
		>
			<div class="page-container">
				<div class="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
					<div class="col-span-2 md:col-span-1">
						<div class="mb-3 flex items-center gap-2">
							<BrandLogo class="h-9 w-9" width={72} height={72} />
							<span class="text-lg font-bold">{HOOMBAN_BRAND_NAME}</span>
						</div>
						<p class="text-sm leading-relaxed text-muted-foreground">
							کلینیک روانشناسی و روان‌درمانی در اراک
						</p>
					</div>
					<div>
						<h3 class="mb-3 text-sm font-bold">خدمات</h3>
						<ul class="space-y-2 text-sm text-muted-foreground">
							<li>روان‌درمانی و روانکاوی</li>
							<li>نوروتراپی و نوروفیدبک</li>
							<li>RTMS / TDCS</li>
							<li>تست‌های روانشناسی</li>
						</ul>
					</div>
					<div>
						<h3 class="mb-3 text-sm font-bold">دسترسی</h3>
						<ul class="space-y-2 text-sm text-muted-foreground">
							<li>
								<a
									href="/appointments/book"
									class="transition-colors duration-200 hover:text-foreground"
								>
									نوبت‌دهی
								</a>
							</li>
							<li>
								<a href="/auth" class="transition-colors duration-200 hover:text-foreground">
									ورود
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h3 class="mb-3 text-sm font-bold">تماس</h3>
						<ul class="space-y-2 text-sm text-muted-foreground">
							<li>اراک، ایران</li>
							<li dir="ltr" class="text-right">hoomban.com</li>
							<li dir="ltr" class="text-right">info@hoomban.com</li>
						</ul>
					</div>
				</div>
				<div class="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
					<p>© {new Date().getFullYear()} کلینیک روانشناسی هومبان — اراک</p>
				</div>
			</div>
		</footer>
	</LandingScrollReveal>
</div>
