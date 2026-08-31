<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Spring } from 'svelte/motion';
	import { cn } from '$lib/utils';

	let {
		mousePos,
		isVertical,
		title,
		href,
		active = false,
		icon,
		onNavigate
	}: {
		mousePos: number;
		isVertical: boolean;
		title: string;
		href: string;
		active?: boolean;
		icon: Snippet;
		onNavigate: (e: MouseEvent, href: string) => void;
	} = $props();

	const resolvedHref = $derived(href);

	let el = $state<HTMLAnchorElement | null>(null);
	let hovered = $state(false);

	const size = new Spring(40, { stiffness: 0.15, damping: 0.7 });
	const iconSize = new Spring(20, { stiffness: 0.15, damping: 0.7 });

	function lerp(distance: number, minOut: number, maxOut: number) {
		const t = Math.max(0, Math.min(1, 1 - Math.abs(distance) / 150));
		return minOut + (maxOut - minOut) * t;
	}

	$effect(() => {
		const bounds = el?.getBoundingClientRect();
		if (!bounds || !Number.isFinite(mousePos)) {
			size.target = 40;
			iconSize.target = 20;
			return;
		}
		const center = isVertical
			? bounds.y + bounds.height / 2
			: bounds.x + bounds.width / 2;
		const distance = mousePos - center;
		size.target = lerp(distance, 40, 72);
		iconSize.target = lerp(distance, 20, 36);
	});
</script>

<a
	bind:this={el}
	href={resolvedHref}
	class="relative flex shrink-0 items-center justify-center"
	style="width: {size.current}px; height: {size.current}px;"
	aria-label={title}
	aria-current={active ? 'page' : undefined}
	onmouseenter={() => (hovered = true)}
	onmouseleave={() => (hovered = false)}
	onclick={(e) => onNavigate(e, href)}
>
	{#if hovered}
		<span
			class={cn(
				'pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-0.5 text-xs text-popover-foreground shadow-sm',
				isVertical ? 'end-full me-2 top-1/2 -translate-y-1/2' : '-top-8 left-1/2 -translate-x-1/2'
			)}
		>
			{title}
		</span>
	{/if}
	<span
		class={cn(
			'flex aspect-square items-center justify-center rounded-full transition-colors duration-200',
			active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'
		)}
		style="width: {size.current}px; height: {size.current}px;"
	>
		<span
			class="flex items-center justify-center"
			style="width: {iconSize.current}px; height: {iconSize.current}px;"
		>
			{@render icon()}
		</span>
	</span>
</a>
