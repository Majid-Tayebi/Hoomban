<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Chart from '$lib/components/ui/chart.svelte';
	import { TrendingUp } from '@lucide/svelte';

	let {
		percent,
		trend,
		count
	}: {
		percent: number;
		trend: number;
		count: number;
	} = $props();

	const gaugeData = $derived({
		labels: ['رضایت', 'باقی'],
		datasets: [
			{
				data: [percent, 100 - percent],
				backgroundColor: ['#1e7cae', '#ebf5f9'],
				borderWidth: 0,
				circumference: 180,
				rotation: 270
			}
		]
	});

	const gaugeOptions = {
		responsive: true,
		maintainAspectRatio: false,
		cutout: '75%',
		plugins: { legend: { display: false }, tooltip: { enabled: false } }
	};
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardContent class="p-4 sm:p-5">
		<p class="text-sm font-semibold">عملکرد</p>
		<p class="text-xs text-muted-foreground">نرخ رضایت</p>

		<div class="relative mx-auto mt-2 h-28 w-44">
			<Chart type="doughnut" data={gaugeData} options={gaugeOptions} class="h-full w-full" />
			<div class="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center">
				<span class="text-2xl font-bold">{percent.toLocaleString('fa-IR')}%</span>
				<span class="flex items-center gap-0.5 text-[11px] font-medium text-primary">
					<TrendingUp class="h-3 w-3" />
					+{trend}%
				</span>
			</div>
		</div>

		<p class="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
			{count.toLocaleString('fa-IR')} بیمار راضی بوده‌اند. نسبت به ماه قبل رو به افزایش است.
		</p>
	</CardContent>
</Card>
