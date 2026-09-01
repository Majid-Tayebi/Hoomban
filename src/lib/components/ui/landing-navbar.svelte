<script lang="ts">
	import {
		Navbar,
		NavBody,
		NavItems,
		MobileNav,
		MobileNavHeader,
		MobileNavMenu,
		MobileNavToggle,
		NavbarLogo,
		NavbarButton,
		NavbarToggleTheme
	} from '$lib/components/ui/resizable-navbar';
	import { page } from '$app/stores';
	import { loginRedirectUrl } from '$lib/auth-redirect';
	import { getTheme } from '$lib/theme.svelte';

	let {
		user = null,
		heroSection = null
	}: {
		user?: { id?: string } | null;
		heroSection?: HTMLElement | null;
	} = $props();

	const heroTone = $derived(getTheme() === 'dark' ? 'dark' : 'light');

	const navItems = [
		{ name: 'خانه', link: '/' },
		{ name: 'خدمات', link: '#services' },
		{ name: 'متخصصین', link: '#doctors' },
		{ name: 'مقالات', link: '#articles' },
		{ name: 'آزمون‌ها', link: '/tests' }
	];

	let isMobileMenuOpen = $state(false);

	const isLoggedIn = $derived(Boolean(user?.id ?? user));
	const authHref = $derived.by(() => {
		if (isLoggedIn) return '/dashboard';
		const path = $page.url.pathname;
		if (path.startsWith('/tests')) return loginRedirectUrl(path);
		return '/auth';
	});
	const authLabel = $derived(isLoggedIn ? 'داشبورد' : 'ورود');

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	$effect(() => {
		if (!heroSection) return;

		const onScroll = () => {
			if (heroSection.getBoundingClientRect().bottom > 72) {
				isMobileMenuOpen = false;
			}
		};

		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<Navbar introSection={heroSection} {heroTone} hideUntilHeroPassed={false}>
	<NavBody>
		<NavbarLogo />
		<NavItems items={navItems} onItemClick={closeMobileMenu} />
		<div class="relative z-20 flex items-center gap-2">
			<NavbarToggleTheme class="hidden sm:inline-flex" />
			<NavbarButton href={authHref} variant="primary">{authLabel}</NavbarButton>
		</div>
	</NavBody>

	<MobileNav>
		<MobileNavHeader>
			<NavbarLogo />
			<MobileNavToggle isOpen={isMobileMenuOpen} onclick={toggleMobileMenu} />
		</MobileNavHeader>

		<MobileNavMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu}>
			{#each navItems as item (item.link + item.name)}
				<a
					href={item.link}
					class="relative w-full py-1 text-base font-medium"
					onclick={closeMobileMenu}
				>
					<span class="block">{item.name}</span>
				</a>
			{/each}
			<div class="flex w-full flex-col gap-3 border-t border-border/40 pt-4">
				<NavbarToggleTheme class="self-start" />
				<NavbarButton href={authHref} variant="primary" class="w-full" onclick={closeMobileMenu}>
					{authLabel}
				</NavbarButton>
			</div>
		</MobileNavMenu>
	</MobileNav>
</Navbar>

{#if isMobileMenuOpen}
	<button
		type="button"
		class="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] lg:hidden"
		aria-label="بستن منو"
		onclick={closeMobileMenu}
	></button>
{/if}
