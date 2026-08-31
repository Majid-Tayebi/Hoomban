<script lang="ts">
	import { onMount } from 'svelte';
	import Chart, { type ChartType } from 'chart.js/auto';

	let {
		type = 'bar' as ChartType,
		data = {},
		options = {},
		class: className = 'h-64'
	}: { type?: ChartType; data: any; options?: any; class?: string } = $props();
	let canvasElement: HTMLCanvasElement;
	let chartInstance: Chart | undefined;

	onMount(() => {
		if (canvasElement) {
			chartInstance = new Chart(canvasElement, {
				type,
				data,
				options: {
					responsive: true,
					maintainAspectRatio: false,
					...options
				}
			});
		}

		return () => {
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
	<canvas bind:this={canvasElement}></canvas>
</div>
