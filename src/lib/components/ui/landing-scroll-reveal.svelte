<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		class: className = '',
		lazy = true,
		onvisible,
		children
	}: {
		class?: string;
		/** Defer rendering children until near viewport (saves JS + images below fold). */
		lazy?: boolean;
		onvisible?: () => void;
		children?: Snippet;
	} = $props();

	let root = $state<HTMLElement | null>(null);
	let visible = $state(false);
	let notified = $state(false);

	function markVisible() {
		if (visible) return;
		visible = true;
		if (!notified) {
			notified = true;
			onvisible?.();
		}
	}

	$effect(() => {
		if (!root) return;

		const mobile = window.matchMedia('(max-width: 639px)').matches;
		if (mobile || !lazy) {
			markVisible();
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) markVisible();
			},
			{ threshold: 0.05, rootMargin: '0px 0px 8% 0px' }
		);

		observer.observe(root);

		const fallback = window.setTimeout(markVisible, 2500);

		return () => {
			observer.disconnect();
			window.clearTimeout(fallback);
		};
	});
</script>

<div
	bind:this={root}
	class={cn(
		'transition-all duration-700 ease-out motion-reduce:transition-none',
		visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
		className
	)}
>
	{#if !lazy || visible}
		{#if children}
			{@render children()}
		{/if}
	{/if}
</div>
