<script lang="ts">
	import BrandLogo from '$lib/components/brand-logo.svelte';
	import BrandSocialIcon from '$lib/components/ui/brand-social-icon.svelte';
	import { HOOMBAN_BRAND_NAME } from '$lib/brand/logo';

	type FooterLink = { name: string; href: string };
	type FooterSection = { title: string; links: FooterLink[] };
	type SocialBrand = 'instagram' | 'telegram' | 'bale';
	type SocialLink = {
		brand: SocialBrand;
		href: string;
		label: string;
	};

	const defaultSections: FooterSection[] = [
		{
			title: 'خدمات',
			links: [
				{ name: 'روان‌درمانی و روانکاوی', href: '#services' },
				{ name: 'نوروتراپی و نوروفیدبک', href: '#services' },
				{ name: 'RTMS / TDCS', href: '#services' },
				{ name: 'تست‌های روانشناسی', href: '/tests' }
			]
		},
		{
			title: 'دسترسی',
			links: [
				{ name: 'رزرو نوبت', href: '/appointments/book' },
				{ name: 'متخصصین', href: '#doctors' },
				{ name: 'مقالات', href: '#articles' },
				{ name: 'سوالات متداول', href: '/faq' }
			]
		}
	];

	const defaultSocialLinks: SocialLink[] = [
		{ brand: 'instagram', href: '#', label: 'اینستاگرام' },
		{ brand: 'telegram', href: '#', label: 'تلگرام' },
		{ brand: 'bale', href: '#', label: 'بله' }
	];

	const defaultLegalLinks: FooterLink[] = [
		{ name: 'قوانین و مقررات', href: '#' },
		{ name: 'حریم خصوصی', href: '#' }
	];

	const designerTelegramUrl = 'https://t.me/majid_tayebi';
	const currentYear = new Date().getFullYear();

	let {
		logoUrl = '/',
		description = 'کلینیک روانشناسی و روان‌درمانی در اراک — فضایی امن برای شروع مسیر درمان با تیم همدل و رویکرد علمی.',
		sections = defaultSections,
		socialLinks = defaultSocialLinks,
		mapEmbedSrc = 'https://balad.ir/embed?p=6HNER7dBlKOEMu',
		mapTitle = 'مشاهده «کلینیک روانشناسی هومبان» روی نقشه بلد',
		legalLinks = defaultLegalLinks
	}: {
		logoUrl?: string;
		description?: string;
		sections?: FooterSection[];
		socialLinks?: SocialLink[];
		mapEmbedSrc?: string;
		mapTitle?: string;
		legalLinks?: FooterLink[];
	} = $props();
</script>

<footer class="border-t border-border bg-white py-20 text-foreground dark:bg-background sm:py-24 lg:py-32">
	<div class="page-container">
		<div
			class="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-right"
		>
			<div class="flex w-full flex-col justify-between gap-6 lg:max-w-sm lg:items-start">
				<div class="flex items-center gap-2 lg:justify-start">
					<a
						href={logoUrl}
						class="flex items-center gap-2 transition-opacity duration-200 ease-in-out hover:opacity-90"
					>
						<BrandLogo class="h-8 w-8" width={64} height={64} />
						<h2 class="text-xl font-semibold">{HOOMBAN_BRAND_NAME}</h2>
					</a>
				</div>
				<p class="max-w-md text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>
				<ul class="flex items-center gap-5 text-muted-foreground">
					{#each socialLinks as social (social.label)}
						<li>
							<a
								href={social.href}
								aria-label={social.label}
								class="inline-flex rounded-md p-1 transition-all duration-200 ease-in-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 {social.brand !== 'bale' ? 'hover:text-primary' : ''}"
							>
								<BrandSocialIcon brand={social.brand} class="size-5" />
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<div class="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(17rem,22rem)] lg:gap-10 xl:gap-16">
				{#each sections as section (section.title)}
					<div>
						<h3 class="mb-4 text-sm font-bold">{section.title}</h3>
						<ul class="space-y-3 text-sm text-muted-foreground">
							{#each section.links as link (link.name)}
								<li>
									<a
										href={link.href}
										class="font-medium transition-colors duration-200 ease-in-out hover:text-primary"
									>
										{link.name}
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/each}

				{#if mapEmbedSrc}
					<div class="sm:col-start-2 sm:row-start-2 lg:col-start-3 lg:row-start-1">
						<h3 class="mb-4 text-sm font-bold">آدرس کلینیک</h3>
						<div
							class="overflow-hidden rounded-xl border border-border bg-muted/20 shadow-sm"
						>
							<iframe
								src={mapEmbedSrc}
								title={mapTitle}
								class="aspect-[16/10] w-full border-0"
								loading="lazy"
								referrerpolicy="no-referrer-when-downgrade"
								allowfullscreen
							></iframe>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<div
			class="mt-8 flex flex-col justify-between gap-4 border-t border-border py-8 text-xs font-medium text-muted-foreground md:flex-row md:items-center md:text-right"
		>
			<div class="order-2 space-y-1 md:order-1">
				<p>
					© {currentYear} کلینیک روانشناسی {HOOMBAN_BRAND_NAME} — اراک. تمامی حقوق محفوظ است.
				</p>
				<p>
					طراحی شده توسط
					<a
						href={designerTelegramUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="text-foreground underline-offset-4 transition-colors duration-200 ease-in-out hover:text-primary hover:underline"
					>
						مجید طیبی
					</a>
				</p>
			</div>
			<ul class="order-1 flex flex-col gap-2 md:order-2 md:flex-row md:gap-6">
				{#each legalLinks as link (link.name)}
					<li>
						<a
							href={link.href}
							class="transition-colors duration-200 ease-in-out hover:text-primary"
						>
							{link.name}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</footer>
