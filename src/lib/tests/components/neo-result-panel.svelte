<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { NEO_DOMAIN_MAX, NEO_FACET_MAX, bandLabelFa } from '$lib/psych/neo-240/score';
	import { buildNeoInterpretationHtml } from '$lib/psych/neo-240/interpret';
	import type { NeoScores } from '$lib/psych/neo-240/score';
	import PsychResultPrintCover from '$lib/tests/components/psych-result-print-cover.svelte';
	import PsychRadarChart from '$lib/tests/components/psych-radar-chart.svelte';

	let {
		testTitle,
		scores,
		interpretationText,
		participantName = '',
		participantMobile = '',
		participantEmail = '',
		testedAt = '',
		preview = false
	}: {
		testTitle: string;
		scores: NeoScores;
		interpretationText: string;
		participantName?: string;
		participantMobile?: string;
		participantEmail?: string;
		testedAt?: string;
		preview?: boolean;
	} = $props();

	const view = $derived(buildNeoInterpretationHtml(scores));
	const chartLabels = $derived(view.domains.map((d) => d.label));
	const chartData = $derived(view.domains.map((d) => d.score));
</script>

<div class="mx-auto max-w-3xl space-y-4">
	<PsychResultPrintCover
		{preview}
		{testTitle}
		{participantName}
		{participantMobile}
		{participantEmail}
		{testedAt}
	/>

	<div class={preview ? 'hidden' : 'print:hidden'}>
		<h1 class="text-xl font-bold sm:text-2xl">{testTitle}</h1>
		<p class="mt-1 text-sm text-muted-foreground">تفسیر NEO — فرم بلند ۲۴۰ سوال</p>
	</div>

	<Card class={preview ? 'hidden' : 'rounded-2xl shadow-sm print:hidden'}>
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">نمودار پنج عامل بزرگ شخصیت</CardTitle>
		</CardHeader>
		<CardContent class="flex justify-center px-4 pb-4 sm:px-6">
			<div class="w-full max-w-md">
			{#if !preview}
				<PsychRadarChart labels={chartLabels} data={chartData} label="نمره عامل" max={NEO_DOMAIN_MAX} />
			{/if}
			</div>
		</CardContent>
	</Card>

	<div class="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
		{#each view.domains as domain (domain.key)}
			<Card class="rounded-2xl border-border/70 shadow-sm">
				<CardHeader class="px-4 pb-2 pt-4">
					<div class="flex items-center justify-between gap-2">
						<CardTitle class="text-sm">{domain.label}</CardTitle>
						<span class="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
							{bandLabelFa(domain.band)}
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

	<Card class="rounded-2xl shadow-sm break-inside-avoid">
		<CardHeader class="px-4 pt-4 sm:px-6 print:px-0 print:pt-2">
			<CardTitle class="text-base">جدول خرده‌مقیاس‌ها</CardTitle>
		</CardHeader>
		<CardContent class="overflow-x-auto px-4 pb-4 sm:px-6 print:px-0 print:pb-2">
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
							<td class="px-2 py-2">{bandLabelFa(facet.band)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</CardContent>
	</Card>

	<Card class="rounded-2xl shadow-sm break-inside-avoid">
		<CardHeader class="px-4 pt-4 sm:px-6 print:px-0 print:pt-2">
			<CardTitle class="text-base">تفسیر متنی</CardTitle>
		</CardHeader>
		<CardContent class="px-4 pb-4 sm:px-6 print:px-0 print:pb-2">
			<pre
				class="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">{interpretationText}</pre>
		</CardContent>
	</Card>
</div>
