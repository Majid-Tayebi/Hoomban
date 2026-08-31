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
</script>

<div class={cn('flex w-full flex-row items-center justify-between', className)}>
	{#if children}
		{@render children()}
	{/if}
</div>
