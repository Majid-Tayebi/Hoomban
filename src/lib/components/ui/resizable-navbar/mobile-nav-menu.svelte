<script lang="ts">
	import { getContext, type Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import { NAVBAR_CONTEXT, DEFAULT_NAVBAR_CONTEXT, type NavbarContext } from './context';

	let {
		isOpen,
		onClose,
		class: className = '',
		children
	}: {
		isOpen: boolean;
		onClose?: () => void;
		class?: string;
		children?: Snippet;
	} = $props();

	const ctx = getContext<NavbarContext>(NAVBAR_CONTEXT) ?? DEFAULT_NAVBAR_CONTEXT;

	function onWindowKeydown(e: KeyboardEvent) {
		if (isOpen && e.key === 'Escape') onClose?.();
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if isOpen}
	<div
		transition:fade={{ duration: 150 }}
		class={cn(
			'fixed inset-x-3 top-[4.25rem] z-50 flex max-h-[min(70dvh,28rem)] w-[calc(100%-1.5rem)] flex-col items-start justify-start gap-3 overflow-y-auto rounded-2xl px-4 py-5 shadow-xl sm:inset-x-4 sm:top-[4.75rem] sm:w-[calc(100%-2rem)]',
			ctx.onHero
				? 'border border-white/20 bg-white/90 text-foreground backdrop-blur-xl'
				: 'border border-border/60 bg-background/95 text-foreground backdrop-blur-md',
			className
		)}
		role="dialog"
		aria-modal="true"
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}
