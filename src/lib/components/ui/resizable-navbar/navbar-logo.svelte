<script lang="ts">
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';
	import BrandLogo from '$lib/components/brand-logo.svelte';
	import { NAVBAR_CONTEXT, DEFAULT_NAVBAR_CONTEXT, type NavbarContext } from './context';

	let {
		href = '/',
		name = 'هومبان',
		class: className = ''
	}: {
		href?: string;
		name?: string;
		class?: string;
	} = $props();

	const ctx = getContext<NavbarContext>(NAVBAR_CONTEXT) ?? DEFAULT_NAVBAR_CONTEXT;
	const onDarkHero = $derived(ctx.onHero && ctx.heroTone === 'dark' && !ctx.visible);
</script>

<a href={href} class={cn('relative z-20 flex items-center gap-2.5 px-2 py-1', className)}>
	<BrandLogo class="h-9 w-9 sm:h-10 sm:w-10" width={80} height={80} priority />
	<span class={cn('text-sm font-bold sm:text-base', onDarkHero ? 'text-white' : 'text-primary')}>
		{name}
	</span>
</a>
