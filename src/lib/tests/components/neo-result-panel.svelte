<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { NEO_DOMAIN_MAX, NEO_FACET_MAX } from '$lib/psych/neo-240/score';
	import { buildNeoInterpretationHtml } from '$lib/psych/neo-240/interpret';
	import type { NeoScores } from '$lib/psych/neo-240/score';
	import { onDestroy } from 'svelte';
	import type { Chart as ChartJs } from 'chart.js';

	let {
		testTitle,
		scores,
		answers,
		interpretationText
	}: {
		testTitle: string;
		scores: NeoScores;
		answers: {
			order: number;
			question_text: string;
			selected_option: string;
			facet_key?: string;
		}[];
		interpretationText: string;
	} = $props();

	const view = $derived(buildNeoInterpretationHtml(scores));
	let chart: ChartJs | null = null;
	let canvasElement = $state<HTMLCanvasElement | null>(null);
	let ChartCtor = $state<typeof ChartJs | null>(null);
	let showAllAnswers = $state(false);

	const bandLabel = (band: string) =>
		band === 'low' ? 'پایین' : band === 'high' ? 'بالا' : 'متوسط';

	async function createChart() {
		if (!canvasElement) return;
		if (!ChartCtor) {
			const mod = await import('chart.js/auto');
			ChartCtor = mod.default;
		}
		if (chart) chart.destroy();
		chart = new ChartCtor(canvasElement, {
			type: 'radar',
			data: {
				labels: view.domains.map((d) => d.label),
				datasets: [
					{
						label: 'نمره عامل',
						data: view.domains.map((d) => d.score),
						backgroundColor: 'hsla(152, 48%, 20%, 0.15)',
						borderColor: 'hsl(152, 48%, 20%)',
						borderWidth: 2,
						pointBackgroundColor: 'hsl(152, 48%, 20%)'
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				scales: {
					r: {
						beginAtZero: true,
						max: NEO_DOMAIN_MAX,
						ticks: { display: false },
						pointLabels: { font: { family: 'Vazirmatn', size: 11 } }
					}
				},
				plugins: { legend: { display: false } }
			}
		});
	}

	$effect(() => {
		if (canvasElement) void createChart();
	});

	onDestroy(() => chart?.destroy());
</script>

<div class="mx-auto max-w-3xl space-y-4">
	<div>
		<h1 class="text-xl font-bold sm:text-2xl">{testTitle}</h1>
		<p class="mt-1 text-sm text-muted-foreground">پاسخنامه و تفسیر NEO — فرم بلند ۲۴۰ سوال</p>
	</div>

	<Card class="rounded-2xl shadow-sm">
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">نمودار پنج عامل بزرگ شخصیت</CardTitle>
		</CardHeader>
		<CardContent class="flex justify-center px-4 pb-4 sm:px-6">
			<div class="w-full max-w-md">
				<canvas bind:this={canvasElement}></canvas>
			</div>
		</CardContent>
	</Card>

	<div class="grid gap-3 sm:grid-cols-2">
		{#each view.domains as domain (domain.key)}
			<Card class="rounded-2xl border-border/70 shadow-sm">
				<CardHeader class="px-4 pb-2 pt-4">
					<div class="flex items-center justify-between gap-2">
						<CardTitle class="text-sm">{domain.label}</CardTitle>
						<span class="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
							{bandLabel(domain.band)}
						</span>
					</div>
					<p class="text-xs text-muted-foreground">نمره: {domain.score} از {NEO_DOMAIN_MAX}</p>
				</CardHeader>
				<CardContent class="px-4 pb-4">
					<p class="text-xs font-semibold text-foreground">{domain.title}</p>
					<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{domain.body}</p>
				</CardContent>
			</Card>
		{/each}
	</div>

	<Card class="rounded-2xl shadow-sm">
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">جدول خرده‌مقیاس‌ها (۳۰ فست)</CardTitle>
		</CardHeader>
		<CardContent class="overflow-x-auto px-4 pb-4 sm:px-6">
			<table class="w-full min-w-[28rem] text-right text-xs">
				<thead>
					<tr class="border-b border-border text-muted-foreground">
						<th class="px-2 py-2 font-medium">کد</th>
						<th class="px-2 py-2 font-medium">عنوان</th>
						<th class="px-2 py-2 font-medium">عامل</th>
						<th class="px-2 py-2 font-medium">نمره</th>
						<th class="px-2 py-2 font-medium">سطح</th>
					</tr>
				</thead>
				<tbody>
					{#each view.facets as facet (facet.key)}
						<tr class="border-b border-border/50">
							<td class="px-2 py-2 font-mono">{facet.key}</td>
							<td class="px-2 py-2">{facet.label}</td>
							<td class="px-2 py-2">{facet.domain}</td>
							<td class="px-2 py-2">{facet.score}/{NEO_FACET_MAX}</td>
							<td class="px-2 py-2">{bandLabel(facet.band)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</CardContent>
	</Card>

	<Card class="rounded-2xl shadow-sm">
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">تفسیر متنی</CardTitle>
		</CardHeader>
		<CardContent class="px-4 pb-4 sm:px-6">
			<pre
				class="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">{interpretationText}</pre>
		</CardContent>
	</Card>

	<Card class="rounded-2xl shadow-sm">
		<CardHeader class="flex flex-row items-center justify-between gap-2 px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">پاسخنامه ({answers.length} سوال)</CardTitle>
			<button
				type="button"
				class="text-xs font-medium text-primary transition-colors hover:underline"
				onclick={() => (showAllAnswers = !showAllAnswers)}
			>
				{showAllAnswers ? 'نمایش خلاصه' : 'نمایش همه'}
			</button>
		</CardHeader>
		<CardContent class="space-y-2 px-4 pb-4 sm:px-6">
			{#each showAllAnswers ? answers : answers.slice(0, 12) as answer (answer.order)}
				<div class="rounded-xl border border-border/60 p-3">
					<p class="text-xs text-muted-foreground">
						سوال {answer.order}
						{#if answer.facet_key}
							— {answer.facet_key}
						{/if}
					</p>
					<p class="mt-1 text-sm font-medium">{answer.question_text}</p>
					<p class="mt-1 text-xs text-primary">پاسخ: {answer.selected_option}</p>
				</div>
			{/each}
			{#if !showAllAnswers && answers.length > 12}
				<p class="text-center text-xs text-muted-foreground">
					{answers.length - 12} سوال دیگر — «نمایش همه» را بزنید
				</p>
			{/if}
		</CardContent>
	</Card>
</div>
