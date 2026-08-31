<script lang="ts" module>
	import type { Component } from 'svelte';

	export type SidebarLinkItem = {
		label: string;
		href: string;
		icon: Component;
		onclick?: (e: MouseEvent) => void;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		link: SidebarLinkItem;
		class?: string;
		active?: boolean;
	}

	let { link, class: className = '', active = false }: Props = $props();

	function handleClick(e: MouseEvent) {
		if (link.onclick) {
			e.preventDefault();
			link.onclick(e);
		}
	}

	const Icon = $derived(link.icon);
</script>

<a
	href={link.href}
	class={cn(
		'flex flex-row items-center gap-2 rounded-xl py-2 text-sm text-foreground transition-all duration-200 ease-in-out hover:bg-muted',
		active && 'bg-primary/10 text-primary',
		className
	)}
	onclick={handleClick}
>
	<span class="flex h-5 w-5 shrink-0 items-center justify-center">
		<Icon class="h-5 w-5" aria-hidden="true" />
	</span>
	<span class="whitespace-nowrap">{link.label}</span>
</a>
