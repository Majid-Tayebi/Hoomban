<script lang="ts">
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';
	import { NAVBAR_CONTEXT, DEFAULT_NAVBAR_CONTEXT, type NavbarContext } from './context';

	let {
		items,
		onItemClick,
		class: className = ''
	}: {
		items: { name: string; link: string }[];
		onItemClick?: () => void;
		class?: string;
	} = $props();

	let hovered = $state<number | null>(null);

	const ctx = getContext<NavbarContext>(NAVBAR_CONTEXT) ?? DEFAULT_NAVBAR_CONTEXT;
	const onDarkHero = $derived(ctx.onHero && ctx.heroTone === 'dark' && !ctx.visible);

	function isActive(link: string) {
		if (link === '/') return $page.url.pathname === '/';
		if (link.startsWith('#')) return false;
		return $page.url.pathname.startsWith(link);
	}
</script>

<nav
	class={cn(
		'pointer-events-none absolute inset-0 hidden flex-1 flex-row items-center justify-center gap-2 text-sm font-medium transition-colors duration-200 lg:flex',
		ctx.visible
			? 'text-muted-foreground'
			: onDarkHero
				? 'text-white/80'
				: 'text-foreground/75',
		className
	)}
>
	{#each items as item, idx (item.link + item.name)}
		<a
			href={item.link}
			class={cn(
				'pointer-events-auto relative px-4 py-2 transition-colors duration-200',
				isActive(item.link)
					? cn('font-semibold', onDarkHero ? 'text-white' : 'text-primary')
					: ctx.visible
						? 'text-muted-foreground hover:text-foreground'
						: onDarkHero
							? 'text-white/75 hover:text-white'
							: 'text-foreground/75 hover:text-foreground'
			)}
			onmouseenter={() => (hovered = idx)}
			onmouseleave={() => (hovered = null)}
			onclick={() => onItemClick?.()}
		>
			<span
				class={cn(
					'absolute inset-0 rounded-full transition-opacity duration-200',
					onDarkHero ? 'bg-white/10' : ctx.visible ? 'bg-muted/80' : 'bg-white/40',
					hovered === idx ? 'opacity-100' : 'opacity-0'
				)}
				aria-hidden="true"
			></span>
			<span class="relative z-10">{item.name}</span>
		</a>
	{/each}
</nav>
