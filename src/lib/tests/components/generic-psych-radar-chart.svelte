<script lang="ts">
	import { parsePsychJsonField } from '$lib/psych/parse-json-field';
	import PsychRadarChart from '$lib/tests/components/psych-radar-chart.svelte';

	let { scoresJson }: { scoresJson: unknown } = $props();

	const scores = $derived(parsePsychJsonField<Record<string, number>>(scoresJson));
	const labels = $derived(scores ? Object.keys(scores) : []);
	const data = $derived(scores ? Object.values(scores).map(Number) : []);
</script>

{#if labels.length}
	<PsychRadarChart {labels} {data} />
{/if}
