<script lang="ts">
	import { type Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { X } from '@lucide/svelte';

	let {
		open = $bindable(false),
		title = '',
		class: className = '',
		children
	}: {
		open?: boolean;
		title?: string;
		class?: string;
		children: Snippet;
	} = $props();

	function close() {
		open = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) close();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<button
		type="button"
		class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
		aria-label="بستن"
		onclick={close}
	></button>
	<div
		class={cn(
			'fixed z-50 flex flex-col bg-background shadow-xl',
			/* mobile: bottom sheet; sm+: side drawer */
			'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t',
			'sm:inset-y-0 sm:bottom-auto sm:right-0 sm:left-auto sm:max-h-none sm:w-[min(100vw,20rem)] sm:rounded-none sm:border-l sm:border-t-0',
			className
		)}
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<div class="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted sm:hidden" aria-hidden="true"></div>
		<div class="flex items-center justify-between border-b px-4 py-3">
			<h2 class="text-base font-semibold">{title}</h2>
			<button type="button" class="rounded-lg p-2 hover:bg-muted" aria-label="بستن" onclick={close}>
				<X class="h-5 w-5" />
			</button>
		</div>
		<div class="safe-bottom flex-1 overflow-y-auto p-4">
			{@render children()}
		</div>
	</div>
{/if}
