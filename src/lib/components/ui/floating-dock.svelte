<script lang="ts">
	import type { Component } from 'svelte';
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	import { Menu, X } from '@lucide/svelte';
	import FloatingDockIcon from './floating-dock-icon.svelte';

	function toHref(path: string): string {
		return path;
	}

	export type FloatingDockItem = {
		title: string;
		href: string;
		icon: Component;
		active?: boolean;
	};

	let {
		items,
		class: className = '',
		mobileClassName = '',
		desktopClassName = '',
		orientation = 'vertical'
	}: {
		items: FloatingDockItem[];
		class?: string;
		mobileClassName?: string;
		desktopClassName?: string;
		orientation?: 'vertical' | 'horizontal';
	} = $props();

	let mousePos = $state(Infinity);
	let mobileOpen = $state(false);
	const isVertical = $derived(orientation === 'vertical');

	function onMouseMove(e: MouseEvent) {
		mousePos = isVertical ? e.clientY : e.clientX;
	}

	function onMouseLeave() {
		mousePos = Infinity;
	}

	function onNavigate(e: MouseEvent, href: string) {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
		e.preventDefault();
		mobileOpen = false;
		goto(toHref(href));
	}
</script>

<!-- Desktop -->
<div class={cn('pointer-events-auto hidden md:block', className, desktopClassName)}>
	<div
		role="navigation"
		aria-label="ناوبری اصلی"
		onmousemove={onMouseMove}
		onmouseleave={onMouseLeave}
		class={cn(
			'rounded-2xl border border-border/60 bg-card/90 shadow-lg backdrop-blur-xl',
			isVertical
				? 'flex flex-col items-center gap-3 px-3 py-4'
				: 'mx-auto flex h-16 items-end gap-4 px-4 pb-3'
		)}
	>
		{#each items as item (item.href + item.title)}
			{@const Icon = item.icon}
			<FloatingDockIcon
				{mousePos}
				{isVertical}
				title={item.title}
				href={item.href}
				active={Boolean(item.active)}
				{onNavigate}
			>
				{#snippet icon()}
					<Icon class="h-full w-full" />
				{/snippet}
			</FloatingDockIcon>
		{/each}
	</div>
</div>

<!-- Mobile fab -->
<div class={cn('relative block md:hidden', mobileClassName)}>
	{#if mobileOpen}
		<div
			class="absolute inset-x-0 bottom-full mb-2 flex flex-col items-center gap-2"
			role="navigation"
			aria-label="منوی موبایل"
		>
			{#each [...items].reverse() as item (item.href + item.title)}
				{@const Icon = item.icon}
				<a
					href={toHref(item.href)}
					class={cn(
						'flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card shadow-md transition-all duration-200 hover:bg-muted',
						item.active && 'ring-2 ring-primary/40'
					)}
					onclick={(e) => onNavigate(e, item.href)}
					aria-label={item.title}
					aria-current={item.active ? 'page' : undefined}
				>
					<Icon
						class={cn('h-5 w-5', item.active ? 'text-primary' : 'text-muted-foreground')}
					/>
				</a>
			{/each}
		</div>
	{/if}
	<button
		type="button"
		class="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground shadow-md transition-colors duration-200 hover:bg-muted hover:text-foreground"
		aria-label={mobileOpen ? 'بستن منو' : 'باز کردن منو'}
		aria-expanded={mobileOpen}
		onclick={() => (mobileOpen = !mobileOpen)}
	>
		{#if mobileOpen}
			<X class="h-5 w-5" />
		{:else}
			<Menu class="h-5 w-5" />
		{/if}
	</button>
</div>
