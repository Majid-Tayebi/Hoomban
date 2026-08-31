<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Chart from '$lib/components/ui/chart.svelte';
	import { PATIENT_OVERVIEW_CHART, overviewChartOptions } from '../data/mock-data';
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4 sm:px-5">
		<div>
			<CardTitle class="text-sm font-semibold sm:text-base">نمای کلی بیماران</CardTitle>
			<p class="text-xs text-muted-foreground">بستری و سرپایی در هفته</p>
		</div>
		<select
			class="rounded-lg border border-input bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground"
			aria-label="بازه زمانی"
		>
			<option>هفته اخیر</option>
			<option>ماه اخیر</option>
		</select>
	</CardHeader>
	<CardContent class="px-4 pb-4 sm:px-5">
		<div class="h-52 sm:h-56">
			<Chart type="bar" data={PATIENT_OVERVIEW_CHART} options={overviewChartOptions} class="h-full w-full" />
		</div>
	</CardContent>
</Card>
