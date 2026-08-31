<script lang="ts">
	import ToggleTheme from '$lib/components/ui/toggle-theme.svelte';
	import {
		Navbar,
		NavBody,
		NavItems,
		MobileNav,
		MobileNavHeader,
		MobileNavMenu,
		MobileNavToggle,
		NavbarLogo,
		NavbarButton
	} from '$lib/components/ui/resizable-navbar';

	let {
		user = null,
		introSection = null
	}: {
		user?: { id?: string } | null;
		introSection?: HTMLElement | null;
	} = $props();

	const navItems = [
		{ name: 'خدمات', link: '#services' },
		{ name: 'متخصصین', link: '#doctors' },
		{ name: 'مقالات', link: '#articles' },
		{ name: 'تست‌ها', link: '/tests' }
	];

	let isMobileMenuOpen = $state(false);

	const isLoggedIn = $derived(Boolean(user?.id ?? user));
	const authHref = $derived(isLoggedIn ? '/dashboard' : '/auth');
	const authLabel = $derived(isLoggedIn ? 'داشبورد' : 'ورود');
	const bookHref = $derived(isLoggedIn ? '/appointments/book' : '/auth');

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}
</script>

<div class="relative w-full">
	<Navbar {introSection}>
		<NavBody>
			<NavbarLogo />
			<NavItems items={navItems} />
			<div class="relative z-20 flex items-center gap-2">
				<ToggleTheme />
				<NavbarButton href={authHref} variant="secondary">{authLabel}</NavbarButton>
				<NavbarButton href={bookHref} variant="primary">نوبت‌دهی</NavbarButton>
			</div>
		</NavBody>

		<MobileNav>
			<MobileNavHeader>
				<NavbarLogo />
				<MobileNavToggle
					isOpen={isMobileMenuOpen}
					onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				/>
			</MobileNavHeader>

			<MobileNavMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu}>
				{#each navItems as item (item.link + item.name)}
					<a
						href={item.link}
						class="relative text-neutral-600 dark:text-neutral-300"
						onclick={closeMobileMenu}
					>
						<span class="block">{item.name}</span>
					</a>
				{/each}
				<div class="flex w-full flex-col gap-4">
					<ToggleTheme class="self-start" />
					<NavbarButton href={authHref} variant="secondary" class="w-full" onclick={closeMobileMenu}>
						{authLabel}
					</NavbarButton>
					<NavbarButton href={bookHref} variant="primary" class="w-full" onclick={closeMobileMenu}>
						نوبت‌دهی
					</NavbarButton>
				</div>
			</MobileNavMenu>
		</MobileNav>
	</Navbar>
</div>
