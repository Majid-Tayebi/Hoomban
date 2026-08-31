<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Chart from '$lib/components/ui/chart.svelte';
	import { trendsChartOptions } from '../constants/chart-options';

	let {
		total = 0,
		chartData
	}: {
		total?: number;
		chartData: {
			labels: string[];
			datasets: {
				label: string;
				data: number[];
				backgroundColor: string;
				borderRadius: number;
			}[];
		};
	} = $props();
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 pt-4 px-4 sm:px-5">
		<div>
			<CardTitle class="text-sm font-semibold sm:text-base">روند نوبت‌ها</CardTitle>
			<p class="mt-1 text-xs text-muted-foreground">
				کل نوبت‌ها: <strong class="text-foreground">{total.toLocaleString('fa-IR')}</strong>
			</p>
		</div>
		<select
			class="rounded-lg border border-input bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground sm:text-xs"
			aria-label="بازه زمانی"
		>
			<option>این هفته</option>
			<option>این ماه</option>
		</select>
	</CardHeader>
	<CardContent class="px-4 pb-4 sm:px-5">
		<div class="h-52 sm:h-56">
			<Chart type="bar" data={chartData} options={trendsChartOptions} class="h-full w-full" />
		</div>
	</CardContent>
</Card>
