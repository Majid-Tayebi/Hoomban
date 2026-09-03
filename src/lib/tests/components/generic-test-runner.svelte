<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { loginRedirectUrl } from '$lib/auth-redirect';
	import { getErrorMessage } from '$lib/errors';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { slide } from 'svelte/transition';

	export type GenericQuestionOption = { text: string; scores?: Record<string, number> };
	export type GenericQuestion = {
		id: string;
		question_text: string;
		options: GenericQuestionOption[];
	};

	let {
		testId,
		testTitle,
		slug,
		questions
	}: {
		testId: string;
		testTitle: string;
		slug: string;
		questions: GenericQuestion[];
	} = $props();

	let user = $derived(getUser());
	let currentQuestionIndex = $state(0);
	let answers = $state<Record<number, string>>({});
	let isSubmitting = $state(false);
	let error = $state('');

	const draftKey = $derived(`generic-draft:${slug}:${user?.id ?? 'guest'}`);

	const progress = $derived(
		questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
	);
	const isAuthed = $derived(Boolean(user?.id && user.id !== 'demo-user'));

	function restoreDraft() {
		if (typeof localStorage === 'undefined') return;
		try {
			const raw = localStorage.getItem(draftKey);
			if (!raw) return;
			const parsed = JSON.parse(raw) as {
				answers?: Record<number, string>;
				currentQuestionIndex?: number;
			};
			if (parsed.answers) answers = parsed.answers;
			if (typeof parsed.currentQuestionIndex === 'number') {
				currentQuestionIndex = Math.min(
					Math.max(0, parsed.currentQuestionIndex),
					Math.max(0, questions.length - 1)
				);
			}
		} catch {
			/* ignore */
		}
	}

	function saveDraft() {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(draftKey, JSON.stringify({ answers, currentQuestionIndex }));
	}

	function clearDraft() {
		if (typeof localStorage === 'undefined') return;
		localStorage.removeItem(draftKey);
	}

	$effect(() => {
		if (questions.length) restoreDraft();
	});

	$effect(() => {
		if (Object.keys(answers).length || currentQuestionIndex > 0) saveDraft();
	});

	function handleAnswer(optionIndex: number) {
		answers[currentQuestionIndex] = String(optionIndex);
		saveDraft();
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
		if (!isAuthed) {
			goto(loginRedirectUrl(`/tests/${slug}`));
			return;
		}

		isSubmitting = true;
		error = '';
		try {
			const answerPayload: Record<string, number> = {};
			for (const [index, value] of Object.entries(answers)) {
				answerPayload[index] = parseInt(value, 10);
			}

			const res = await fetch('/api/psych/generic/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ testId, answers: answerPayload })
			});
			const data = (await res.json()) as { id?: string; error?: string };
			if (!res.ok || !data.id) {
				throw new Error(data.error || 'خطا در ثبت نتیجه');
			}

			goto(`/tests/result/${data.id}`);
			clearDraft();
		} catch (err: unknown) {
			error = getErrorMessage(err, 'خطا در ثبت نتیجه');
		} finally {
			isSubmitting = false;
		}
	}
</script>

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
				<CardTitle class="text-base leading-snug">{testTitle}</CardTitle>
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
