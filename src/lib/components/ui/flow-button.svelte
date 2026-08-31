<script lang="ts">
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils';

	type FlowVariant = 'primary' | 'secondary';

	let {
		text,
		href,
		icon: Icon,
		variant = 'primary',
		class: className = ''
	}: {
		text: string;
		href: string;
		icon?: Component<{ class?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
		variant?: FlowVariant;
		class?: string;
	} = $props();

	const shellClass: Record<FlowVariant, string> = {
		primary:
			'border-cerulean-400/50 bg-cerulean-600 text-white hover:text-white',
		secondary:
			'border-white/20 bg-white/10 text-white backdrop-blur-sm hover:text-white'
	};

	const circleClass: Record<FlowVariant, string> = {
		primary: 'bg-cerulean-500',
		secondary: 'bg-white/25'
	};
</script>

<a
	{href}
	class={cn(
		'group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-full border-[1.5px] px-8 py-2.5 text-sm font-semibold transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rounded-xl hover:border-transparent active:scale-[0.95]',
		shellClass[variant],
		className
	)}
>
	<span class="relative z-[1] flex items-center gap-2">
		{text}
		{#if Icon}
			<Icon class="h-4 w-4 shrink-0" aria-hidden={true} />
		{/if}
	</span>

	<span
		class={cn(
			'absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:h-[220px] group-hover:w-[220px] group-hover:opacity-100',
			circleClass[variant]
		)}
		aria-hidden="true"
	></span>
</a>
