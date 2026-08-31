<script lang="ts">
	import { getContext } from 'svelte';
	import ToggleTheme from '$lib/components/ui/toggle-theme.svelte';
	import { cn } from '$lib/utils';
	import { NAVBAR_CONTEXT, DEFAULT_NAVBAR_CONTEXT, type NavbarContext } from './context';

	let { class: className = '' }: { class?: string } = $props();

	const ctx = getContext<NavbarContext>(NAVBAR_CONTEXT) ?? DEFAULT_NAVBAR_CONTEXT;
	const onDarkHero = $derived(ctx.onHero && ctx.heroTone === 'dark' && !ctx.visible);
</script>

<ToggleTheme
	class={cn(
		onDarkHero ? 'text-white/85 hover:bg-white/10' : 'hover:bg-muted/60',
		className
	)}
/>
