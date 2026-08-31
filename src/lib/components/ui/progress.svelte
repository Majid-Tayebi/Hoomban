<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		class: className = '',
		value = 0,
		max = 100,
		...restProps
	}: {
		class?: string;
		value?: number;
		max?: number;
		[key: string]: unknown;
	} = $props();

	const pct = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
</script>

<div
	class={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
	role="progressbar"
	aria-valuemin={0}
	aria-valuemax={max}
	aria-valuenow={value}
	{...restProps}
>
	<div
		class="h-full rounded-full bg-primary transition-all duration-300 ease-in-out"
		style="width: {pct}%"
	></div>
</div>
