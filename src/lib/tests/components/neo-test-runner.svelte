<script lang="ts">
	import { goto } from '$app/navigation';
	import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
	import { getUser } from '$lib/auth.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { NEO_LIKERT_OPTIONS, NEO_PAGE_SIZE } from '$lib/psych/neo-240/meta';
	import { buildNeoInterpretation } from '$lib/psych/neo-240/interpret';
	import { scoreNeo240, type NeoAnswerInput } from '$lib/psych/neo-240/score';
	import {
		optionScoreAt,
		parseQuestionOptions,
		type NeoQuestionOption
	} from '$lib/psych/neo-240/option-scores';
	import {
		likertOptionsFromConfig,
		parseNeoScoringConfig,
		type NeoScoringConfig
	} from '$lib/psych/neo-240/scoring-config';
	import { loginRedirectUrl } from '$lib/auth-redirect';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	type NeoQuestion = {
		id: string;
		order: number;
		question_text: string;
		domain_key: string;
		facet_key: string;
		options_json: NeoQuestionOption[];
	};

	let {
		testId,
		testTitle,
		slug
	}: {
		testId: string;
		testTitle: string;
		slug: string;
	} = $props();

	let user = $derived(getUser());
	let questions = $state<NeoQuestion[]>([]);
	let scoringConfig = $state<NeoScoringConfig>({});
	let pageIndex = $state(0);
	let answers = $state<Record<number, number>>({});
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let error = $state('');

	const isAuthed = $derived(Boolean(user?.id && user.id !== 'demo-user'));
	const draftKey = $derived(`neo-draft:${slug}:${user?.id ?? 'guest'}`);
	const totalPages = $derived(Math.ceil(questions.length / NEO_PAGE_SIZE) || 1);
	const pageQuestions = $derived(
		questions.slice(pageIndex * NEO_PAGE_SIZE, pageIndex * NEO_PAGE_SIZE + NEO_PAGE_SIZE)
	);
	const answeredCount = $derived(Object.keys(answers).length);
	const progress = $derived(questions.length ? (answeredCount / questions.length) * 100 : 0);
	const isLastPage = $derived(pageIndex >= totalPages - 1);

	function restoreDraft() {
		if (typeof localStorage === 'undefined') return;
		try {
			const raw = localStorage.getItem(draftKey);
			if (!raw) return;
			const parsed = JSON.parse(raw) as { answers?: Record<number, number>; pageIndex?: number };
			if (parsed.answers) answers = parsed.answers;
			if (typeof parsed.pageIndex === 'number') pageIndex = parsed.pageIndex;
		} catch {
			/* ignore */
		}
	}

	function saveDraft() {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(draftKey, JSON.stringify({ answers, pageIndex }));
	}

	const likertOptions = $derived(likertOptionsFromConfig(scoringConfig));

	async function loadQuestions() {
		if (!isAuthed) return;
		isLoading = true;
		error = '';
		try {
			const test = await pb.collection('psych_tests').getOne(testId, PB_NO_AUTO_CANCEL);
			scoringConfig = parseNeoScoringConfig(test.scoring_config);

			const result = await pb.collection('psych_questions').getList(1, 250, {
				filter: `test = "${testId}"`,
				sort: 'order',
				...PB_NO_AUTO_CANCEL
			});
			const labels = parseNeoScoringConfig(test.scoring_config).likert;
			questions = result.items.map((q) => ({
				id: q.id,
				order: Number(q.order),
				question_text: String(q.question_text),
				domain_key: String(q.domain_key || ''),
				facet_key: String(q.facet_key || ''),
				options_json: parseQuestionOptions(q.options_json, labels, Boolean(q.reverse_scored))
			}));
			restoreDraft();
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'خطا در بارگذاری سوالات';
		} finally {
			isLoading = false;
		}
	}

	function setAnswer(order: number, optionIndex: number) {
		answers = { ...answers, [order]: optionIndex };
		saveDraft();
	}

	function pageAnswered(): boolean {
		return pageQuestions.every((q) => answers[q.order] !== undefined);
	}

	function goNext() {
		if (!pageAnswered()) {
			error = 'لطفاً به همه سوالات این بخش پاسخ دهید.';
			return;
		}
		error = '';
		if (pageIndex < totalPages - 1) {
			pageIndex += 1;
			saveDraft();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function goPrev() {
		error = '';
		if (pageIndex > 0) {
			pageIndex -= 1;
			saveDraft();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	async function submitTest() {
		if (!pageAnswered()) {
			error = 'لطفاً به همه سوالات این بخش پاسخ دهید.';
			return;
		}
		if (answeredCount < questions.length) {
			error = `هنوز ${questions.length - answeredCount} سوال بی‌پاسخ مانده است.`;
			return;
		}
		if (!user) {
			goto(loginRedirectUrl(`/tests/${slug}`));
			return;
		}
		if (user.id === 'demo-user') {
			error = 'در حالت نمایشی نتیجه ذخیره نمی‌شود.';
			return;
		}

		isSubmitting = true;
		error = '';
		try {
			const answerInputs: NeoAnswerInput[] = [];
			const answersJson = questions.map((q) => {
				const selectedIndex = answers[q.order] ?? 0;
				const selected = likertOptions[selectedIndex] ?? NEO_LIKERT_OPTIONS[selectedIndex];
				const scorePoints = optionScoreAt(q.options_json, selectedIndex);
				answerInputs.push({
					order: q.order,
					selected_index: selectedIndex,
					domain_key: q.domain_key as NeoAnswerInput['domain_key'],
					facet_key: q.facet_key as NeoAnswerInput['facet_key'],
					score_points: scorePoints,
					question_text: q.question_text
				});
				return {
					question_id: q.id,
					order: q.order,
					question_text: q.question_text,
					facet_key: q.facet_key,
					domain_key: q.domain_key,
					selected_option: selected.text,
					selected_index: selectedIndex,
					score_points: scorePoints
				};
			});

			const scores = scoreNeo240(answerInputs, scoringConfig);
			const interpretation = buildNeoInterpretation(scores);

			const result = await pb.collection('psych_results').create({
				user: user.id,
				test: testId,
				answers_json: JSON.stringify(answersJson),
				scores_json: JSON.stringify(scores),
				interpretation_text: interpretation
			});

			if (typeof localStorage !== 'undefined') localStorage.removeItem(draftKey);
			goto(`/tests/result/${result.id}`);
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'خطا در ثبت نتیجه';
		} finally {
			isSubmitting = false;
		}
	}

	$effect(() => {
		if (testId && isAuthed) void loadQuestions();
	});
</script>

{#if !isAuthed}
	<p class="py-16 text-center text-sm text-muted-foreground">برای شروع آزمون وارد شوید.</p>
{:else if isLoading}
	<p class="py-16 text-center text-sm text-muted-foreground">در حال بارگذاری آزمون نئو...</p>
{:else if error && !questions.length}
	<Card class="rounded-2xl shadow-sm">
		<CardContent class="space-y-4 p-6">
			<p class="text-sm text-destructive">{error}</p>
			<Button class="h-11 w-full rounded-xl" onclick={() => goto('/tests')}>بازگشت</Button>
		</CardContent>
	</Card>
{:else}
	<div class="mx-auto max-w-2xl space-y-4">
		<div>
			<h1 class="text-lg font-bold sm:text-xl">{testTitle}</h1>
			<p class="mt-1 text-xs text-muted-foreground sm:text-sm">
				بخش {pageIndex + 1} از {totalPages} — {answeredCount} از {questions.length} سوال پاسخ داده شده
			</p>
			<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full bg-primary transition-all duration-300"
					style="width: {progress}%"
				></div>
			</div>
		</div>

		<div class="space-y-3">
			{#each pageQuestions as question (question.id)}
				<Card class="rounded-2xl border-border/70 shadow-sm">
					<CardHeader class="px-4 pb-2 pt-4 sm:px-5">
						<p class="text-xs font-medium text-primary">
							سوال {question.order}
							<span class="text-muted-foreground"> — {question.facet_key}</span>
						</p>
						<CardTitle class="text-sm font-semibold leading-relaxed sm:text-base">
							{question.question_text}
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2 px-4 pb-4 sm:px-5">
						{#each likertOptions as option, optionIndex (option.value)}
							<button
								type="button"
								class="w-full rounded-xl border px-3 py-2.5 text-right text-sm transition-colors duration-200 ease-in-out {answers[
									question.order
								] === optionIndex
									? 'border-primary bg-primary/10 font-medium text-primary'
									: 'border-border hover:border-primary/40 hover:bg-muted/50'}"
								onclick={() => setAnswer(question.order, optionIndex)}
							>
								{option.text}
							</button>
						{/each}
					</CardContent>
				</Card>
			{/each}
		</div>

		{#if error}
			<p class="text-sm text-destructive" role="alert">{error}</p>
		{/if}

		<div class="grid grid-cols-2 gap-2 pb-4">
			<Button variant="outline" class="h-11 rounded-xl" onclick={goPrev} disabled={pageIndex === 0}>
				<ChevronRight class="me-1 h-4 w-4" />
				قبلی
			</Button>
			{#if isLastPage}
				<Button
					class="h-11 rounded-xl"
					onclick={submitTest}
					disabled={isSubmitting || answeredCount < questions.length}
				>
					{isSubmitting ? 'ثبت نتیجه...' : 'مشاهده نتیجه و تفسیر'}
				</Button>
			{:else}
				<Button class="h-11 rounded-xl" onclick={goNext}>
					بعدی
					<ChevronLeft class="ms-1 h-4 w-4" />
				</Button>
			{/if}
		</div>
	</div>
{/if}
