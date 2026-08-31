<script lang="ts">
	import { goto } from '$app/navigation';
	import { pb } from '$lib/pocketbase';
	import { getUser } from '$lib/auth.svelte';
	import { invalidateAll } from '$app/navigation';
	import LandingNavbar from '$lib/components/ui/landing-navbar.svelte';
	import LandingHeroBanner from '$lib/components/ui/landing-hero-banner.svelte';
	import LandingScrollReveal from '$lib/components/ui/landing-scroll-reveal.svelte';
	import LandingTrustSection from '$lib/components/ui/landing-trust-section.svelte';
	import LandingFeaturesSection from '$lib/components/ui/landing-features-section.svelte';
	import DoctorsShowcase from '$lib/components/doctors-showcase.svelte';
	import InfiniteMovingCardsDemo from '$lib/components/ui/infinite-moving-cards-demo.svelte';
	import LandingFaqSection from '$lib/components/ui/landing-faq-section.svelte';
	import LandingCtaSection from '$lib/components/ui/landing-cta-section.svelte';
	import { HOOMBAN_BRAND_NAME, HOOMBAN_LOGO_SRC } from '$lib/brand/logo';
	import type {
		LandingDoctor,
		LandingService,
		LandingTestimonial
	} from '$lib/landing/public-data';

	let {
		data
	}: {
		data: {
			connected: boolean;
			message: string;
			doctors: LandingDoctor[];
			services: LandingService[];
			testimonials: LandingTestimonial[];
		};
	} = $props();

	let user = $derived(getUser());
	let heroSection = $state<HTMLElement | null>(null);

	const testimonials = $derived(data.testimonials);

	$effect(() => {
		let cancelled = false;

		void pb.collection('doctors').subscribe('*', () => {
			if (!cancelled) void invalidateAll();
		});

		return () => {
			cancelled = true;
			void pb.collection('doctors').unsubscribe('*');
		};
	});
</script>

<div class="min-h-dvh bg-white text-foreground dark:bg-background">
	<LandingHeroBanner bind:root={heroSection} />

	<LandingNavbar {user} heroSection={heroSection} />

	<LandingScrollReveal>
		<LandingTrustSection />
	</LandingScrollReveal>

	<LandingScrollReveal>
		<LandingFeaturesSection services={data.services} />
	</LandingScrollReveal>

	{#if data.doctors.length}
		<LandingScrollReveal>
			<section id="doctors" class="bg-white px-4 pt-20 pb-6 dark:bg-background sm:px-6 sm:pt-24 sm:pb-8">
				<div class="mx-auto mb-8 max-w-3xl text-center">
					<p class="mb-2 text-xs font-semibold tracking-wide text-primary sm:text-sm">تیم درمان</p>
					<h2 class="text-2xl font-bold tracking-tight sm:text-4xl">متخصصین هومبان</h2>
					<p class="mt-3 text-sm text-muted-foreground sm:text-base">
						روانشناسان و درمانگران کلینیک — انتخاب متخصص مناسب برای شما
					</p>
				</div>
				<DoctorsShowcase
					doctors={data.doctors}
					testimonials={testimonials}
					onBook={(doctorId) =>
						goto(doctorId ? `/appointments/book?doctor=${doctorId}` : '/appointments/book')}
				/>
			</section>
		</LandingScrollReveal>
	{/if}

	{#if testimonials.length}
		<LandingScrollReveal>
			<section
				id="testimonials"
				class="overflow-hidden bg-white px-4 pb-12 pt-2 dark:bg-background sm:px-6 sm:pb-16 sm:pt-4"
			>
				<div class="mx-auto mb-5 max-w-2xl text-center">
					<p class="mb-1.5 text-xs font-semibold tracking-wide text-primary sm:text-sm">بازخوردها</p>
					<h2 class="text-xl font-bold tracking-tight sm:text-3xl">نظر مراجعان</h2>
					<p class="mt-1.5 text-sm text-muted-foreground">از بازخوردهای منتشرشده در سایت هومبان</p>
				</div>
				<InfiniteMovingCardsDemo
					compact
					items={testimonials.map((tm) => ({
						quote: tm.body,
						name: tm.author,
						title: tm.source || 'مراجع هومبان'
					}))}
				/>
			</section>
		</LandingScrollReveal>
	{/if}

	<LandingScrollReveal>
		<LandingFaqSection />
	</LandingScrollReveal>

	<LandingScrollReveal>
		<LandingCtaSection />
	</LandingScrollReveal>

	<LandingScrollReveal>
		<footer
			class="border-t border-border bg-white px-4 py-12 text-foreground dark:bg-background sm:px-6 sm:py-14"
		>
			<div class="page-container">
				<div class="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
					<div class="col-span-2 md:col-span-1">
						<div class="mb-3 flex items-center gap-2">
							<img
								src={HOOMBAN_LOGO_SRC}
								alt=""
								class="h-9 w-9 object-contain"
								width="72"
								height="72"
							/>
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
