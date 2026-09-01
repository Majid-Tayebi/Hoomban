<script lang="ts">
	import { page } from '$app/stores';
	import { pb } from '$lib/pocketbase';
	import { getUser } from '$lib/auth.svelte';
	import { loginRedirectUrl } from '$lib/auth-redirect';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import NeoTestRunner from '$lib/tests/components/neo-test-runner.svelte';
	import { slide } from 'svelte/transition';

	type QuestionOption = { text: string; scores?: Record<string, number> };
	type Question = {
		id: string;
		question_text: string;
		options: QuestionOption[];
	};

	let slug = $derived($page.params.slug ?? '');
	let user = $derived(getUser());
	let test = $state<{
		id: string;
		title: string;
		test_type?: string;
		scoring_rules?: { min: number; max: number; label: string; interpretation: string }[];
	} | null>(null);
	let questions = $state<Question[]>([]);
	let currentQuestionIndex = $state(0);
	let answers = $state<Record<number, string>>({});
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let error = $state('');

	const progress = $derived(
		questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
	);
	const isNeo240 = $derived(test?.test_type === 'neo_240');
	const testPath = $derived(`/tests/${slug}`);
	const authed = $derived(Boolean(user?.id && user.id !== 'demo-user'));

	async function loadTest() {
		if (!slug || !authed) return;
		isLoading = true;
		error = '';
		try {
			const testResult = await pb.collection('psych_tests').getFirstListItem(`slug = "${slug}"`);
			test = {
				id: testResult.id,
				title: String(testResult.title),
				test_type: testResult.test_type ? String(testResult.test_type) : undefined,
				scoring_rules: Array.isArray(testResult.scoring_rules)
					? (testResult.scoring_rules as {
							min: number;
							max: number;
							label: string;
							interpretation: string;
						}[])
					: undefined
			};

			if (test.test_type === 'neo_240') {
				questions = [];
				return;
			}

			const questionsResult = await pb.collection('psych_questions').getList(1, 100, {
				filter: `test = "${test.id}"`,
				sort: 'order'
			});
			questions = questionsResult.items.map((q) => ({
				id: q.id,
				question_text: String(q.question_text),
				options:
					typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json
			}));
		} catch (err: unknown) {
			const e = err as { message?: string };
			error = 'خطا در بارگذاری تست: ' + (e.message || 'تست یافت نشد');
		} finally {
			isLoading = false;
		}
	}

	function handleAnswer(optionIndex: number) {
		answers[currentQuestionIndex] = String(optionIndex);
	}

	function nextQuestion() {
		if (currentQuestionIndex < questions.length - 1) currentQuestionIndex++;
	}

	function previousQuestion() {
		if (currentQuestionIndex > 0) currentQuestionIndex--;
	}

	async function submitTest() {
		if (Object.keys(answers).length < questions.length) {
			error = 'لطفاً به تمام سوالات پاسخ دهید';
			return;
		}
		if (!authed || !test) {
			goto(loginRedirectUrl(testPath));
			return;
		}

		isSubmitting = true;
		error = '';
		try {
			const scores: Record<string, number> = {};
			const answersJson: unknown[] = [];

			questions.forEach((q, qIndex) => {
				const selectedOptionIndex = parseInt(answers[qIndex], 10);
				const selectedOption = q.options[selectedOptionIndex];
				answersJson.push({
					question_id: q.id,
					question_text: q.question_text,
					selected_option: selectedOption.text,
					scores: selectedOption.scores
				});
				if (selectedOption.scores) {
					const points = Number(
						selectedOption.scores.score ?? selectedOption.scores.value ?? 0
					);
					scores.total = (scores.total || 0) + points;
					Object.entries(selectedOption.scores).forEach(([key, value]) => {
						if (key === 'score' || key === 'value') return;
						scores[key] = (scores[key] || 0) + Number(value);
					});
				}
			});

			const totalScore = Number(
				scores.total ?? Object.values(scores).reduce((a, b) => a + Number(b), 0)
			);
			const maxScore = questions.length * 3;
			let interpretation = '';
			const rules = test.scoring_rules;
			if (rules?.length) {
				const match = rules.find((r) => totalScore >= r.min && totalScore <= r.max);
				interpretation = match
					? `${match.label}: ${match.interpretation || ''}`.trim()
					: `نمره کل: ${totalScore}`;
			} else if (totalScore <= maxScore * 0.33) {
				interpretation = 'نتیجه: سطح خفیف — وضعیت کلی خوب است.';
			} else if (totalScore <= maxScore * 0.66) {
				interpretation = 'نتیجه: سطح متوسط — مشورت با متخصص توصیه می‌شود.';
			} else {
				interpretation = 'نتیجه: سطح بالا — حتماً با روانشناس مشورت کنید.';
			}

			const result = await pb.collection('psych_results').create({
				user: user!.id,
				test: test.id,
				answers_json: JSON.stringify(answersJson),
				scores_json: JSON.stringify(scores),
				interpretation_text: interpretation
			});

			goto(`/tests/result/${result.id}`);
		} catch (err: unknown) {
			const e = err as { message?: string };
			error = 'خطا در ثبت نتیجه: ' + (e.message || 'مشکلی پیش آمد');
		} finally {
			isSubmitting = false;
		}
	}

	$effect(() => {
		if (authed && slug) void loadTest();
	});
</script>

{#if !authed}
	<p class="py-16 text-center text-sm text-muted-foreground">در حال انتقال به صفحه ورود...</p>
{:else if isLoading}
	<p class="py-16 text-center text-sm text-muted-foreground">در حال بارگذاری آزمون...</p>
{:else if error && !test}
	<Card class="rounded-2xl shadow-sm">
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">خطا</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4 px-4 pb-4 sm:px-6">
			<p class="text-sm text-destructive">{error}</p>
			<Button class="h-11 w-full rounded-xl" onclick={() => goto('/tests')}>بازگشت به آزمون‌ها</Button>
		</CardContent>
	</Card>
{:else if test && isNeo240}
	<NeoTestRunner testId={test.id} testTitle={test.title} {slug} />
{:else if test && questions.length > 0}
	<div class="mx-auto max-w-xl space-y-4">
		<div>
			<div class="mb-2 flex items-center justify-between text-sm">
				<span class="text-muted-foreground">سوال {currentQuestionIndex + 1} از {questions.length}</span>
				<span class="font-medium">{Math.round(progress)}٪</span>
			</div>
			<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full bg-primary transition-all duration-300"
					style="width: {progress}%"
				></div>
			</div>
		</div>

		<div transition:slide={{ duration: 200 }}>
			<Card class="rounded-2xl shadow-sm">
				<CardHeader class="px-4 pt-4 sm:px-6">
					<CardTitle class="text-base leading-snug">{test.title}</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4 px-4 pb-4 sm:px-6">
					<p class="text-sm leading-relaxed sm:text-base">
						{questions[currentQuestionIndex].question_text}
					</p>
					<div class="space-y-2">
						{#each questions[currentQuestionIndex].options as option, index (index)}
							<button
								type="button"
								class="w-full rounded-xl border p-3.5 text-right text-sm transition-colors duration-200 ease-in-out {answers[
									currentQuestionIndex
								] === String(index)
									? 'border-primary bg-primary/10 font-medium text-primary'
									: 'border-border hover:border-primary/40 hover:bg-muted/60'}"
								onclick={() => handleAnswer(index)}
							>
								{option.text}
							</button>
						{/each}
					</div>
					{#if error}
						<p class="text-sm text-destructive" role="alert">{error}</p>
					{/if}
				</CardContent>
			</Card>
		</div>

		<div class="grid grid-cols-2 gap-2">
			<Button
				variant="outline"
				class="h-11 rounded-xl"
				onclick={previousQuestion}
				disabled={currentQuestionIndex === 0}
			>
				قبلی
			</Button>
			{#if currentQuestionIndex === questions.length - 1}
				<Button
					class="h-11 rounded-xl"
					onclick={submitTest}
					disabled={isSubmitting || answers[currentQuestionIndex] === undefined}
				>
					{isSubmitting ? 'ثبت...' : 'ثبت نهایی'}
				</Button>
			{:else}
				<Button
					class="h-11 rounded-xl"
					onclick={nextQuestion}
					disabled={answers[currentQuestionIndex] === undefined}
				>
					بعدی
				</Button>
			{/if}
		</div>
	</div>
{/if}
