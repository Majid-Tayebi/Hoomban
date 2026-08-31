<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { NAVBAR_CONTEXT, type NavbarContext } from './context';

	const SCROLL_THRESHOLD = 100;
	const REVEAL_OFFSET_FALLBACK = 72;
	const DESKTOP_MIN_WIDTH = 1024;

	let {
		class: className = '',
		introSection = null,
		heroTone = 'light',
		hideUntilHeroPassed = false,
		children
	}: {
		class?: string;
		introSection?: HTMLElement | null;
		heroTone?: 'dark' | 'light';
		/** Hide navbar until hero section is scrolled past (Oleum-style) */
		hideUntilHeroPassed?: boolean;
		children?: Snippet;
	} = $props();

	const ctx: NavbarContext = $state({
		visible: false,
		revealed: !hideUntilHeroPassed,
		onHero: true,
		heroTone
	});
	setContext(NAVBAR_CONTEXT, ctx);

	function isDesktopViewport() {
		return window.innerWidth >= DESKTOP_MIN_WIDTH;
	}

	function onWindowScroll() {
		const scrollY = window.scrollY;
		const heroBottom = introSection?.getBoundingClientRect().bottom ?? 0;
		const heroHeight = introSection?.offsetHeight ?? window.innerHeight;
		const revealOffset = Math.max(REVEAL_OFFSET_FALLBACK, window.innerHeight * 0.78);
		const desktop = isDesktopViewport();

		if (hideUntilHeroPassed && introSection) {
			ctx.revealed = desktop || heroBottom <= revealOffset;
		} else {
			ctx.revealed = scrollY > SCROLL_THRESHOLD;
		}

		ctx.onHero = introSection ? heroBottom > revealOffset : scrollY < heroHeight;
		ctx.visible =
			!desktop && ctx.revealed && scrollY > heroHeight * 0.15 + SCROLL_THRESHOLD;
	}

	$effect(() => {
		ctx.heroTone = heroTone;
	});

	$effect(() => {
		introSection;
		hideUntilHeroPassed;
		onWindowScroll();
	});
</script>

<svelte:window onscroll={onWindowScroll} onresize={onWindowScroll} />

<div
	class={cn(
		'fixed inset-x-0 top-0 z-40 w-full px-3 pt-2 transition-all duration-500 ease-out sm:px-4 sm:pt-3',
		ctx.revealed
			? 'pointer-events-auto translate-y-0 opacity-100'
			: 'pointer-events-none -translate-y-full opacity-0',
		className
	)}
>
	{#if children}
		{@render children()}
	{/if}
</div>
