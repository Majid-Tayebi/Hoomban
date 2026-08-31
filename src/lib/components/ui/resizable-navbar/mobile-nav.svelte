<script lang="ts">
	import { getContext, type Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { NAVBAR_CONTEXT, DEFAULT_NAVBAR_CONTEXT, type NavbarContext } from './context';

	const glassHeroDark =
		'rounded-full bg-white/10 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] ring-1 ring-white/15 backdrop-blur-xl';
	const glassHeroLight =
		'rounded-full bg-white/55 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-white/60 backdrop-blur-xl';
	const glassScrolled =
		'rounded-xl bg-background/90 px-4 shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05),0_1px_0_rgba(255,255,255,0.1)_inset] backdrop-blur-md';

	let {
		class: className = '',
		children
	}: {
		class?: string;
		children?: Snippet;
	} = $props();

	const ctx = getContext<NavbarContext>(NAVBAR_CONTEXT) ?? DEFAULT_NAVBAR_CONTEXT;
	const glassHero = $derived(ctx.heroTone === 'dark' ? glassHeroDark : glassHeroLight);
</script>

<div
	class={cn(
		'relative z-50 mx-auto flex w-full max-w-[calc(100vw-1.5rem)] flex-col items-center justify-between py-2 transition-all duration-500 ease-[cubic-bezier(0.34,1.3,0.64,1)] lg:hidden',
		ctx.visible ? cn('w-[90%] translate-y-5', glassScrolled) : cn('translate-y-0', glassHero),
		className
	)}
>
	{#if children}
		{@render children()}
	{/if}
</div>
