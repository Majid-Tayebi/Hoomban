<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { X } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props {
		open?: boolean;
		class?: string;
		children: Snippet;
		onClose?: () => void;
	}

	let {
		open = false,
		class: className = '',
		children,
		onClose
	}: Props = $props();

	function closeMobile() {
		onClose?.();
	}
</script>

<!-- Desktop -->
<aside
	class={cn(
		'fixed inset-y-0 right-0 z-30 hidden w-52 flex-col overflow-hidden border-l border-sidebar-border bg-sidebar text-sidebar-foreground print:hidden md:flex',
		className
	)}
	aria-label="نوار کناری"
>
	{@render children()}
</aside>

<!-- Mobile drawer -->
{#if open}
	<button
		type="button"
		class="fixed inset-0 z-[99] bg-black/40 md:hidden"
		aria-label="بستن منو"
		onclick={closeMobile}
	></button>
	<div
		class="fixed inset-y-0 right-0 z-[100] flex h-full w-[min(14rem,88vw)] flex-col border-l border-sidebar-border bg-sidebar shadow-xl md:hidden"
		transition:fly={{ x: 80, duration: 240 }}
		role="dialog"
		aria-modal="true"
		aria-label="منوی ناوبری"
	>
		<div class="absolute left-2 top-2 z-10">
			<button
				type="button"
				class="inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
				aria-label="بستن منو"
				onclick={closeMobile}
			>
				<X class="h-4 w-4" />
			</button>
		</div>
		{@render children()}
	</div>
{/if}
