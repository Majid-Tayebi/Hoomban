<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import BrandLogo from '$lib/components/brand-logo.svelte';
	import LandingFaqSection from '$lib/components/ui/landing-faq-section.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { HOOMBAN_BRAND_NAME } from '$lib/brand/logo';
	import { LANDING_FAQ_ITEMS } from '$lib/landing/faq-items';
	import { faqPageJsonLd, breadcrumbJsonLd } from '$lib/seo/schema';
</script>

<SeoHead
	title={`سوالات متداول | ${HOOMBAN_BRAND_NAME}`}
	description="پاسخ به پرسش‌های رایج درباره خدمات، نوبت‌دهی و حریم خصوصی — کلینیک هومبان اراک"
	path="/faq"
	jsonLd={[
		faqPageJsonLd([...LANDING_FAQ_ITEMS]),
		breadcrumbJsonLd([
			{ name: 'خانه', path: '/' },
			{ name: 'سوالات متداول', path: '/faq' }
		])
	]}
/>

<div class="min-h-dvh bg-white text-foreground dark:bg-background">
	<header class="border-b border-border px-4 py-4 sm:px-6">
		<div class="page-container flex items-center justify-between gap-4">
			<a href="/" class="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80">
				<BrandLogo class="h-9 w-9" width={72} height={72} />
				<span class="font-bold">{HOOMBAN_BRAND_NAME}</span>
			</a>
			<a
				href="/"
				class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
			>
				<ArrowRight class="h-4 w-4" />
				بازگشت به خانه
			</a>
		</div>
	</header>

	<main>
		<LandingFaqSection />
	</main>
</div>
