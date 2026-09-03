<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import PsychResultPrintCover from '$lib/tests/components/psych-result-print-cover.svelte';
	import GenericPsychRadarChart from '$lib/tests/components/generic-psych-radar-chart.svelte';

	let {
		testTitle,
		interpretationText,
		scoresJson,
		participantName = '',
		participantMobile = '',
		participantEmail = '',
		testedAt = '',
		preview = false
	}: {
		testTitle: string;
		interpretationText: string;
		scoresJson: unknown;
		participantName?: string;
		participantMobile?: string;
		participantEmail?: string;
		testedAt?: string;
		preview?: boolean;
	} = $props();
</script>

<div class="mx-auto max-w-2xl space-y-4">
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
		<p class="mt-1 text-sm text-muted-foreground">نتیجه آزمون روان‌شناختی</p>
	</div>

	<Card class="rounded-2xl shadow-sm break-inside-avoid">
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">تحلیل و تفسیر نتیجه</CardTitle>
		</CardHeader>
		<CardContent class="px-4 pb-4 sm:px-6">
			{#if interpretationText}
				<pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">{interpretationText}</pre>
			{:else}
				<p class="text-sm text-muted-foreground">تفسیر برای این نتیجه ثبت نشده است.</p>
			{/if}
		</CardContent>
	</Card>

	<Card class={preview ? 'hidden' : 'rounded-2xl shadow-sm print:hidden'}>
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">نمودار امتیازات</CardTitle>
		</CardHeader>
		<CardContent class="flex justify-center px-4 pb-4 sm:px-6">
			<div class="w-full max-w-sm">
				<GenericPsychRadarChart {scoresJson} />
			</div>
		</CardContent>
	</Card>
</div>
