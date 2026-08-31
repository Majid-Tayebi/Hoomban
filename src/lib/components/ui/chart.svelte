<script lang="ts">
	import { onMount } from 'svelte';
	import type { ChartType, Chart as ChartJs } from 'chart.js';

	let {
		type = 'bar' as ChartType,
		data = {},
		options = {},
		class: className = 'h-64'
	}: { type?: ChartType; data: any; options?: any; class?: string } = $props();

	let canvasElement: HTMLCanvasElement;
	let chartInstance: ChartJs | undefined;
	let ChartCtor = $state<typeof ChartJs | null>(null);

	onMount(() => {
		let cancelled = false;

		void (async () => {
			const mod = await import('chart.js/auto');
			if (cancelled || !canvasElement) return;
			ChartCtor = mod.default;
			chartInstance = new mod.default(canvasElement, {
				type,
				data,
				options: {
					responsive: true,
					maintainAspectRatio: false,
					...options
				}
			});
		})();

		return () => {
			cancelled = true;
			chartInstance?.destroy();
		};
	});

	$effect(() => {
		if (chartInstance && data) {
			chartInstance.data = data;
			chartInstance.update();
		}
	});
</script>

<div class="w-full {className}">
	{#if !ChartCtor}
		<div class="flex h-full min-h-[8rem] items-center justify-center text-xs text-muted-foreground">
			در حال بارگذاری نمودار…
		</div>
	{/if}
	<canvas bind:this={canvasElement} class={ChartCtor ? '' : 'sr-only'}></canvas>
</div>
