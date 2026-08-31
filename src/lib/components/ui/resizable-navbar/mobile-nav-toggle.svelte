<script lang="ts">
	import { getContext } from 'svelte';
	import { Menu, X } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import { NAVBAR_CONTEXT, DEFAULT_NAVBAR_CONTEXT, type NavbarContext } from './context';

	let {
		isOpen,
		onclick,
		class: className = ''
	}: {
		isOpen: boolean;
		onclick?: () => void;
		class?: string;
	} = $props();

	const ctx = getContext<NavbarContext>(NAVBAR_CONTEXT) ?? DEFAULT_NAVBAR_CONTEXT;
	const onDarkHero = $derived(ctx.onHero && ctx.heroTone === 'dark' && !ctx.visible);
</script>

<button
	type="button"
	class={cn(
		'inline-flex items-center justify-center rounded-full p-2 transition-colors duration-200',
		onDarkHero
			? 'text-white hover:bg-white/10'
			: ctx.visible
				? 'text-foreground hover:bg-muted/60'
				: 'text-foreground/80 hover:bg-white/40',
		className
	)}
	aria-label={isOpen ? 'بستن منو' : 'باز کردن منو'}
	aria-expanded={isOpen}
	{onclick}
>
	{#if isOpen}
		<X class="h-5 w-5" aria-hidden="true" />
	{:else}
		<Menu class="h-5 w-5" aria-hidden="true" />
	{/if}
</button>
