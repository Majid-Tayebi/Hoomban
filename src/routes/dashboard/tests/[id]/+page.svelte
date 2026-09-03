<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
	import { getUser } from '$lib/auth.svelte';
	import { canEditPsychTests, canViewPsychTestsDashboard } from '$lib/rbac';
	import { NEO_TEST_TYPE } from '$lib/psych/neo-240/meta';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Select from '$lib/components/ui/select.svelte';
	import { PSYCH_TEST_CATEGORIES } from '$lib/psych/categories';
	import NeoTestEditor from '$lib/tests/components/neo-test-editor.svelte';
	import { syncGenericPsychQuestionsApi } from '$lib/tests/services/psych-questions-api';
	import { getErrorMessage } from '$lib/errors';
	import { ArrowRight, Plus, Trash2, Save } from '@lucide/svelte';

	type Option = { text: string; scores: { score?: number; value?: number } };
	type Question = { id?: string; question_text: string; order: number; options_json: Option[] };
	type ScoreRule = { min: number; max: number; label: string; interpretation: string };

	let user = $derived(getUser());
	const canView = $derived(canViewPsychTestsDashboard(user?.role));
	const canEdit = $derived(canEditPsychTests(user?.role));
	let testId = $derived($page.params.id);

	let title = $state('');
	let slug = $state('');
	let description = $state('');
	let category = $state('personality');
	let isActive = $state(true);
	let testType = $state('');
	let questions = $state<Question[]>([]);
	let scoringRules = $state<ScoreRule[]>([
		{ min: 0, max: 20, label: 'پایین', interpretation: '' },
		{ min: 21, max: 40, label: 'متوسط', interpretation: '' },
		{ min: 41, max: 100, label: 'بالا', interpretation: '' }
	]);
	let loading = $state(true);
	let saving = $state(false);
	let message = $state('');

	const isNeo240 = $derived(testType === NEO_TEST_TYPE);

	function normalizeOption(opt: Option): Option {
		const score = Number(opt.scores?.score ?? opt.scores?.value ?? 0);
		return { text: String(opt.text || ''), scores: { score, value: score } };
	}

	async function load() {
		if (!testId) return;
		loading = true;
		message = '';
		try {
			const t = await pb.collection('psych_tests').getOne(testId, PB_NO_AUTO_CANCEL);
			title = String(t.title || '');
			slug = String(t.slug || '');
			description = String(t.description || '');
			category = String(t.category || 'personality');
			isActive = Boolean(t.is_active);
			testType = String(t.test_type || '');
			const rules = t.scoring_rules;
			if (Array.isArray(rules) && rules.length) {
				scoringRules = rules as ScoreRule[];
			}

			if (testType === NEO_TEST_TYPE) {
				questions = [];
				return;
			}

			const qRes = await pb.collection('psych_questions').getFullList({
				filter: `test = "${testId}"`,
				sort: 'order',
				...PB_NO_AUTO_CANCEL
			});
			questions = qRes.map((q) => ({
				id: q.id,
				question_text: String(q.question_text || ''),
				order: Number(q.order || 0),
				options_json: Array.isArray(q.options_json)
					? (q.options_json as Option[]).map(normalizeOption)
					: [
							{ text: 'اصلاً', scores: { score: 0, value: 0 } },
							{ text: 'کمی', scores: { score: 1, value: 1 } },
							{ text: 'زیاد', scores: { score: 2, value: 2 } },
							{ text: 'خیلی زیاد', scores: { score: 3, value: 3 } }
						]
			}));
		} catch (e: unknown) {
			message = getErrorMessage(e, 'خطا در بارگذاری');
		} finally {
			loading = false;
		}
	}

	function addQuestion() {
		questions = [
			...questions,
			{
				question_text: '',
				order: questions.length + 1,
				options_json: [
					{ text: 'اصلاً', scores: { score: 0, value: 0 } },
					{ text: 'کمی', scores: { score: 1, value: 1 } },
					{ text: 'زیاد', scores: { score: 2, value: 2 } },
					{ text: 'خیلی زیاد', scores: { score: 3, value: 3 } }
				]
			}
		];
	}

	function removeQuestion(index: number) {
		questions = questions.filter((_, i) => i !== index);
	}

	function addOption(qi: number) {
		questions[qi].options_json = [
			...questions[qi].options_json,
			{ text: 'گزینه جدید', scores: { score: 0, value: 0 } }
		];
	}

	function addRule() {
		scoringRules = [...scoringRules, { min: 0, max: 0, label: '', interpretation: '' }];
	}

	async function saveMeta() {
		if (!testId || !canEdit) return;
		saving = true;
		message = '';
		try {
			await pb.collection('psych_tests').update(testId, {
				title: title.trim(),
				slug: slug.trim(),
				description: description.trim(),
				category,
				is_active: isActive,
				scoring_rules: scoringRules
			});
			message = 'اطلاعات تست ذخیره شد';
		} catch (e: unknown) {
			message = getErrorMessage(e, 'خطا در ذخیره — فقط نقش نویسنده مجاز است');
		} finally {
			saving = false;
		}
	}

	async function saveGenericQuestions() {
		if (!testId || !canEdit || isNeo240) return;
		saving = true;
		message = '';
		try {
			await saveMeta();

			await syncGenericPsychQuestionsApi(pb.authStore.token, testId, questions);
			message = 'تست، سوالات و روش تحلیل ذخیره شد';
		} catch (e: unknown) {
			message = getErrorMessage(e, 'خطا در ذخیره');
		} finally {
			saving = false;
		}
	}

	$effect(() => {
		if (user && !canView) goto('/dashboard');
	});

	$effect(() => {
		if (user && canView && testId) load();
	});
</script>

<div class="space-y-4">
	<button
		type="button"
		class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
		onclick={() => goto('/dashboard/tests')}
	>
		<ArrowRight class="h-4 w-4" />
		بازگشت
	</button>

	{#if loading}
		<p class="py-10 text-center text-sm text-muted-foreground">در حال بارگذاری...</p>
	{:else}
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<h1 class="text-xl font-bold sm:text-2xl">ویرایشگر تست</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					{isNeo240 ? 'آزمون نئو ۲۴۰ — سوالات و تنظیمات نمره‌دهی' : 'سوالات، گزینه‌ها و روش تحلیل'}
				</p>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" class="rounded-xl" onclick={() => goto(`/tests/${slug}`)}>پیش‌نمایش</Button>
				{#if canEdit && !isNeo240}
					<Button class="rounded-xl" disabled={saving} onclick={saveGenericQuestions}>
						<Save class="ms-1 h-4 w-4" />
						ذخیره همه
					</Button>
				{/if}
			</div>
		</div>

		{#if !canEdit}
			<p class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
				فقط نقش <strong>نویسنده</strong> می‌تواند ویرایش کند. شما در حالت مشاهده هستید.
			</p>
		{/if}

		{#if message}
			<p class="rounded-xl bg-accent/50 px-3 py-2 text-sm">{message}</p>
		{/if}

		<Card class="rounded-2xl shadow-sm">
			<CardHeader class="pb-3">
				<CardTitle class="text-base">اطلاعات تست</CardTitle>
			</CardHeader>
			<CardContent class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div class="space-y-1.5 sm:col-span-2 lg:col-span-2">
					<Label>عنوان</Label>
					<Input bind:value={title} disabled={!canEdit} />
				</div>
				<div class="space-y-1.5">
					<Label>اسلاگ</Label>
					<Input bind:value={slug} dir="ltr" disabled={!canEdit} />
				</div>
				<div class="space-y-1.5">
					<Label>دسته</Label>
					<Select bind:value={category} disabled={!canEdit} class="h-10 rounded-xl">
						{#each PSYCH_TEST_CATEGORIES as cat (cat.value)}
							<option value={cat.value}>{cat.label}</option>
						{/each}
					</Select>
				</div>
				<div class="space-y-1.5 sm:col-span-2 lg:col-span-4">
					<Label>توضیح</Label>
					<textarea
						class="min-h-[56px] w-full rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
						bind:value={description}
						disabled={!canEdit}
					></textarea>
				</div>
				<label class="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-4">
					<input type="checkbox" bind:checked={isActive} disabled={!canEdit} />
					فعال
				</label>
				{#if canEdit && !isNeo240}
					<div class="sm:col-span-2 lg:col-span-4">
						<Button variant="outline" size="sm" class="rounded-lg" disabled={saving} onclick={saveMeta}>
							ذخیره اطلاعات پایه
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>

		{#if isNeo240 && testId}
			<NeoTestEditor {testId} readonly={!canEdit} onmessage={(t) => (message = t)} />
		{:else}
			<Card class="rounded-2xl shadow-sm">
				<CardHeader class="flex flex-row items-center justify-between">
					<div>
						<CardTitle class="text-base">سوالات</CardTitle>
						<CardDescription>برای هر سوال چند گزینه با نمره تعریف کنید</CardDescription>
					</div>
					{#if canEdit}
						<Button size="sm" class="rounded-lg" onclick={addQuestion}>
							<Plus class="ms-1 h-4 w-4" />
							سوال
						</Button>
					{/if}
				</CardHeader>
				<CardContent class="space-y-4">
					{#each questions as q, qi (q.id ?? qi)}
						<div class="space-y-2 rounded-xl border p-3">
							<div class="flex items-start gap-2">
								<span class="mt-2 text-xs text-muted-foreground">{qi + 1}</span>
								<textarea
									class="min-h-[60px] flex-1 rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
									bind:value={q.question_text}
									placeholder="متن سوال"
									disabled={!canEdit}
								></textarea>
								{#if canEdit}
									<Button variant="ghost" size="sm" class="text-destructive" onclick={() => removeQuestion(qi)}>
										<Trash2 class="h-4 w-4" />
									</Button>
								{/if}
							</div>
							{#each q.options_json as opt, oi (oi)}
								<div class="flex items-center gap-2 pr-6">
									<Input class="flex-1" bind:value={opt.text} placeholder="متن گزینه" disabled={!canEdit} />
									<Input
										class="w-20"
										type="number"
										value={opt.scores.score ?? opt.scores.value ?? 0}
										oninput={(e: Event) => {
											const v = Number((e.currentTarget as HTMLInputElement).value);
											opt.scores = { score: v, value: v };
										}}
										dir="ltr"
										disabled={!canEdit}
										aria-label="نمره"
									/>
									{#if canEdit}
										<Button
											variant="ghost"
											size="sm"
											onclick={() => {
												q.options_json = q.options_json.filter((_, i) => i !== oi);
											}}
										>
											<Trash2 class="h-3.5 w-3.5" />
										</Button>
									{/if}
								</div>
							{/each}
							{#if canEdit}
								<Button variant="outline" size="sm" class="rounded-lg" onclick={() => addOption(qi)}>
									گزینه جدید
								</Button>
							{/if}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">سوالی نیست — یکی اضافه کنید.</p>
					{/each}
				</CardContent>
			</Card>

			<Card class="rounded-2xl shadow-sm">
				<CardHeader class="flex flex-row items-center justify-between">
					<div>
						<CardTitle class="text-base">روش تحلیل</CardTitle>
						<CardDescription>بازه نمره کل → برچسب و تفسیر</CardDescription>
					</div>
					{#if canEdit}
						<Button size="sm" class="rounded-lg" onclick={addRule}>
							<Plus class="ms-1 h-4 w-4" />
							بازه
						</Button>
					{/if}
				</CardHeader>
				<CardContent class="space-y-3">
					{#each scoringRules as rule, ri (ri)}
						<div class="grid gap-2 rounded-xl border p-3 sm:grid-cols-4">
							<div class="space-y-1">
								<Label class="text-xs">از</Label>
								<Input type="number" bind:value={rule.min} dir="ltr" disabled={!canEdit} />
							</div>
							<div class="space-y-1">
								<Label class="text-xs">تا</Label>
								<Input type="number" bind:value={rule.max} dir="ltr" disabled={!canEdit} />
							</div>
							<div class="space-y-1 sm:col-span-2">
								<Label class="text-xs">برچسب</Label>
								<div class="flex gap-2">
									<Input bind:value={rule.label} disabled={!canEdit} />
									{#if canEdit}
										<Button
											variant="ghost"
											size="sm"
											class="text-destructive"
											onclick={() => {
												scoringRules = scoringRules.filter((_, i) => i !== ri);
											}}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									{/if}
								</div>
							</div>
							<div class="space-y-1 sm:col-span-4">
								<Label class="text-xs">تفسیر</Label>
								<textarea
									class="min-h-[60px] w-full rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
									bind:value={rule.interpretation}
									disabled={!canEdit}
								></textarea>
							</div>
						</div>
					{/each}
				</CardContent>
			</Card>
		{/if}
	{/if}
</div>
