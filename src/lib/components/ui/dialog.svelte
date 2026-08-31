<script lang="ts">
	import { type Snippet } from 'svelte';
	import { Portal } from 'bits-ui';
	import { cn } from '$lib/utils';

	let {
		class: className = '',
		open = $bindable(false),
		children,
		...restProps
	}: {
		class?: string;
		open?: boolean;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	$effect(() => {
		if (typeof document === 'undefined') return;
		document.body.style.overflow = open ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

{#if open}
	<Portal>
		<div class="fixed inset-0 z-[100]" {...restProps}>
			<button
				type="button"
				class="absolute inset-0 cursor-default bg-black/55 transition-opacity duration-200 ease-in-out"
				aria-label="بستن"
				onclick={() => (open = false)}
			></button>

			<div
				class="pointer-events-none fixed inset-0 flex items-center justify-center p-4 sm:p-6"
				role="presentation"
			>
				<div
					class={cn(
						'pointer-events-auto relative z-[101] w-full max-w-md rounded-2xl border border-border/60 bg-background p-5 shadow-2xl sm:p-6',
						className
					)}
					role="dialog"
					aria-modal="true"
				>
					{@render children()}
				</div>
			</div>
		</div>
	</Portal>
{/if}
