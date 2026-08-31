<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Chart from '$lib/components/ui/chart.svelte';
	import { bpChartOptions } from '../data/mock-data';
	import type { VitalsChartData } from '../services/patient-health';

	let { chartData }: { chartData: VitalsChartData | null } = $props();
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="pb-2 pt-4 px-4 sm:px-5">
		<CardTitle class="text-sm font-semibold sm:text-base">فشار خون و ضربان</CardTitle>
		<p class="text-xs text-muted-foreground">روند ثبت‌شده در پرونده</p>
	</CardHeader>
	<CardContent class="px-4 pb-4 sm:px-5">
		{#if chartData}
			<div class="h-52 sm:h-56">
				<Chart type="bar" data={chartData} options={bpChartOptions} class="h-full w-full" />
			</div>
		{:else}
			<div class="flex h-40 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
				<p class="text-xs text-muted-foreground">داده‌ای برای نمودار ثبت نشده</p>
			</div>
		{/if}
	</CardContent>
</Card>
