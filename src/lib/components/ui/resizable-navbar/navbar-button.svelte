<script lang="ts">
	import { getContext, type Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { NAVBAR_CONTEXT, DEFAULT_NAVBAR_CONTEXT, type NavbarContext } from './context';

	type Variant = 'primary' | 'secondary' | 'dark' | 'gradient';

	let {
		href,
		variant = 'primary',
		class: className = '',
		children,
		onclick
	}: {
		href?: string;
		variant?: Variant;
		class?: string;
		children?: Snippet;
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const ctx = getContext<NavbarContext>(NAVBAR_CONTEXT) ?? DEFAULT_NAVBAR_CONTEXT;
	const onDarkHero = $derived(ctx.onHero && ctx.heroTone === 'dark' && !ctx.visible);

	const base =
		'relative z-10 flex cursor-pointer items-center justify-center rounded-full px-4 py-2 text-center text-sm font-medium transition duration-200';

	const variantClass = $derived.by(() => {
		switch (variant) {
			case 'secondary':
				return onDarkHero
					? 'bg-transparent text-white/90 shadow-none hover:bg-white/10'
					: 'bg-transparent text-foreground shadow-none hover:bg-muted/60';
			case 'dark':
				return 'bg-black text-white shadow-sm hover:bg-black/90';
			case 'gradient':
				return 'bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-sm hover:-translate-y-0.5';
			default:
				return onDarkHero
					? 'bg-white text-neutral-900 shadow-sm hover:bg-white/90'
					: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90';
		}
	});
</script>

{#if href}
	<a {href} class={cn(base, variantClass, className)} {onclick}>
		{#if children}
			{@render children()}
		{/if}
	</a>
{:else}
	<button type="button" class={cn(base, variantClass, className)} {onclick}>
		{#if children}
			{@render children()}
		{/if}
	</button>
{/if}
