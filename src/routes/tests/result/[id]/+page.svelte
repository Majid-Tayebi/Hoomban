<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button.svelte';
	import NeoResultPanel from '$lib/tests/components/neo-result-panel.svelte';
	import GenericResultPanel from '$lib/tests/components/generic-result-panel.svelte';
	import { buildNeoInterpretation } from '$lib/psych/neo-240/interpret';
	import { isNeoScores } from '$lib/psych/neo-240/score';
	import { parsePsychJsonField } from '$lib/psych/parse-json-field';
	import PsychResultPdfPreviewDialog from '$lib/tests/components/psych-result-pdf-preview-dialog.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';
	import { Eye } from '@lucide/svelte';

	let {
		data
	}: {
		data: {
			result: {
				interpretation_text: string;
				scores_json: unknown;
				test: { title: string };
				participant: { name: string; mobile: string; email: string };
				created: string;
			};
		};
	} = $props();

	const result = $derived(data.result);
	const test = $derived(result.test);
	const participant = $derived({
		...result.participant,
		testedAt: result.created
	});
	let pdfPreviewOpen = $state(false);

	function printResult() {
		window.print();
	}

	const parsedScores = $derived(parsePsychJsonField<unknown>(result.scores_json));
	const isNeo = $derived(parsedScores !== null && isNeoScores(parsedScores));
	const interpretationText = $derived.by(() => {
		const saved = String(result.interpretation_text || '').trim();
		if (saved) return saved;
		if (isNeo && parsedScores && isNeoScores(parsedScores)) {
			return buildNeoInterpretation(parsedScores);
		}
		return '';
	});
</script>

<SeoHead title={`نتیجه ${test.title}`} description="نتیجه آزمون روان‌شناختی" path="/tests" noindex={true} />

{#if isNeo && parsedScores && isNeoScores(parsedScores)}
	<div class="space-y-4">
		<NeoResultPanel
			testTitle={test.title}
			scores={parsedScores}
			interpretationText={interpretationText}
			participantName={participant.name}
			participantMobile={participant.mobile}
			participantEmail={participant.email}
			testedAt={participant.testedAt}
		/>
		<div class="mx-auto grid max-w-3xl grid-cols-1 gap-2 print:hidden sm:grid-cols-2">
			<Button variant="outline" class="h-11 rounded-xl" onclick={() => (pdfPreviewOpen = true)}>
				<Eye class="ms-1 h-4 w-4" />
				پیش‌نمایش PDF
			</Button>
			<Button variant="outline" class="h-11 rounded-xl" onclick={() => goto('/tests')}>
				بازگشت به تست‌ها
			</Button>
		</div>
		<PsychResultPdfPreviewDialog bind:open={pdfPreviewOpen} onPrint={printResult}>
			<NeoResultPanel
				preview
				testTitle={test.title}
				scores={parsedScores}
				interpretationText={interpretationText}
				participantName={participant.name}
				participantMobile={participant.mobile}
				participantEmail={participant.email}
				testedAt={participant.testedAt}
			/>
		</PsychResultPdfPreviewDialog>
	</div>
{:else}
	<div class="space-y-4">
		<GenericResultPanel
			testTitle={test.title}
			interpretationText={interpretationText}
			scoresJson={result.scores_json}
			participantName={participant.name}
			participantMobile={participant.mobile}
			participantEmail={participant.email}
			testedAt={participant.testedAt}
		/>
		<div class="mx-auto grid max-w-2xl grid-cols-1 gap-2 print:hidden sm:grid-cols-2">
			<Button variant="outline" class="h-11 rounded-xl" onclick={() => (pdfPreviewOpen = true)}>
				<Eye class="ms-1 h-4 w-4" />
				پیش‌نمایش PDF
			</Button>
			<Button variant="outline" class="h-11 rounded-xl" onclick={() => goto('/tests')}>
				بازگشت به تست‌ها
			</Button>
		</div>
		<PsychResultPdfPreviewDialog bind:open={pdfPreviewOpen} onPrint={printResult}>
			<GenericResultPanel
				preview
				testTitle={test.title}
				interpretationText={interpretationText}
				scoresJson={result.scores_json}
				participantName={participant.name}
				participantMobile={participant.mobile}
				participantEmail={participant.email}
				testedAt={participant.testedAt}
			/>
		</PsychResultPdfPreviewDialog>
	</div>
{/if}
