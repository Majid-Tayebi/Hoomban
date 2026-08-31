<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		class: className = '',
		children
	}: {
		class?: string;
		children?: Snippet;
	} = $props();

	let root = $state<HTMLElement | null>(null);
	let visible = $state(false);

	$effect(() => {
		if (!root) return;

		const mobile = window.matchMedia('(max-width: 639px)').matches;
		if (mobile) {
			visible = true;
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) visible = true;
			},
			{ threshold: 0.08, rootMargin: '0px 0px 4% 0px' }
		);

		observer.observe(root);

		const fallback = window.setTimeout(() => {
			visible = true;
		}, 2000);

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
	{#if children}
		{@render children()}
	{/if}
</div>
