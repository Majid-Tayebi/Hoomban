<script lang="ts">
	import Chart from '$lib/components/ui/chart.svelte';

	let {
		labels,
		data,
		label = 'امتیازات',
		max
	}: {
		labels: string[];
		data: number[];
		label?: string;
		max?: number;
	} = $props();

	const chartData = $derived({
		labels,
		datasets: [
			{
				label,
				data,
				backgroundColor: 'hsla(152, 48%, 20%, 0.15)',
				borderColor: 'hsl(152, 48%, 20%)',
				borderWidth: 2,
				pointBackgroundColor: 'hsl(152, 48%, 20%)',
				pointBorderColor: '#fff'
			}
		]
	});

	const chartOptions = $derived({
		maintainAspectRatio: true,
		scales: {
			r: {
				beginAtZero: true,
				max,
				ticks: { display: false },
				pointLabels: { font: { family: 'Vazirmatn', size: 11 } }
			}
		},
		plugins: { legend: { display: false } }
	});
</script>

<Chart type="radar" data={chartData} options={chartOptions} class="aspect-square max-h-80 w-full" />
