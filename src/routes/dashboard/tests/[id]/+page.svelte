<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { pb } from '$lib/pocketbase';
	import { getUser } from '$lib/auth.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { ArrowRight, Plus, Trash2, Save } from '@lucide/svelte';

	type Option = { text: string; scores: { score: number } };
	type Question = { id?: string; question_text: string; order: number; options_json: Option[] };
	type ScoreRule = { min: number; max: number; label: string; interpretation: string };

	let user = $derived(getUser());
	let testId = $derived($page.params.id);

	let title = $state('');
	let slug = $state('');
	let description = $state('');
	let category = $state('personality');
	let isActive = $state(true);
	let questions = $state<Question[]>([]);
	let scoringRules = $state<ScoreRule[]>([
		{ min: 0, max: 20, label: 'پایین', interpretation: '' },
		{ min: 21, max: 40, label: 'متوسط', interpretation: '' },
		{ min: 41, max: 100, label: 'بالا', interpretation: '' }
	]);
	let loading = $state(true);
	let saving = $state(false);
	let message = $state('');

	async function load() {
		if (!testId) return;
		loading = true;
		try {
			const t = await pb.collection('psych_tests').getOne(testId);
			title = String(t.title || '');
			slug = String(t.slug || '');
			description = String(t.description || '');
			category = String(t.category || 'personality');
			isActive = Boolean(t.is_active);
			const rules = t.scoring_rules;
			if (Array.isArray(rules) && rules.length) {
				scoringRules = rules as ScoreRule[];
			}

			const qRes = await pb.collection('psych_questions').getList(1, 200, {
				filter: `test = "${testId}"`,
				sort: 'order'
			});
			questions = qRes.items.map((q) => ({
				id: q.id,
				question_text: String(q.question_text || ''),
				order: Number(q.order || 0),
				options_json: Array.isArray(q.options_json)
					? (q.options_json as Option[])
					: [
							{ text: 'اصلاً', scores: { score: 0 } },
							{ text: 'کمی', scores: { score: 1 } },
							{ text: 'زیاد', scores: { score: 2 } },
							{ text: 'خیلی زیاد', scores: { score: 3 } }
						]
			}));
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'خطا در بارگذاری';
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
					{ text: 'اصلاً', scores: { score: 0 } },
					{ text: 'کمی', scores: { score: 1 } },
					{ text: 'زیاد', scores: { score: 2 } },
					{ text: 'خیلی زیاد', scores: { score: 3 } }
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
			{ text: 'گزینه جدید', scores: { score: 0 } }
		];
	}

	function addRule() {
		scoringRules = [...scoringRules, { min: 0, max: 0, label: '', interpretation: '' }];
	}

	async function saveAll() {
		if (!testId) return;
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

			const existing = await pb.collection('psych_questions').getList(1, 200, {
				filter: `test = "${testId}"`
			});
			const keepIds = new Set(questions.map((q) => q.id).filter(Boolean));
			for (const old of existing.items) {
				if (!keepIds.has(old.id)) {
					await pb.collection('psych_questions').delete(old.id);
				}
			}

			for (let i = 0; i < questions.length; i++) {
				const q = questions[i];
				const payload = {
					test: testId,
					question_text: q.question_text.trim(),
					order: i + 1,
					options_json: q.options_json
				};
				if (q.id) {
					await pb.collection('psych_questions').update(q.id, payload);
				} else {
					const created = await pb.collection('psych_questions').create(payload);
					questions[i].id = created.id;
				}
			}

			message = 'تست، سوالات و روش تحلیل ذخیره شد';
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'خطا در ذخیره';
		} finally {
			saving = false;
		}
	}

	$effect(() => {
		if (user && testId) load();
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
				<p class="mt-1 text-sm text-muted-foreground">سوالات، گزینه‌ها و روش تحلیل</p>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" class="rounded-xl" onclick={() => goto(`/tests/${slug}`)}>پیش‌نمایش</Button>
				<Button class="rounded-xl" disabled={saving} onclick={saveAll}>
					<Save class="ml-1 h-4 w-4" />
					ذخیره همه
				</Button>
			</div>
		</div>

		{#if message}
			<p class="rounded-xl bg-accent/50 px-3 py-2 text-sm">{message}</p>
		{/if}

		<Card class="rounded-2xl shadow-sm">
			<CardHeader>
				<CardTitle class="text-base">اطلاعات تست</CardTitle>
			</CardHeader>
			<CardContent class="grid gap-3 sm:grid-cols-2">
				<div class="space-y-1.5 sm:col-span-2">
					<Label>عنوان</Label>
					<Input bind:value={title} />
				</div>
				<div class="space-y-1.5">
					<Label>اسلاگ</Label>
					<Input bind:value={slug} dir="ltr" />
				</div>
				<div class="space-y-1.5">
					<Label>دسته</Label>
					<Input bind:value={category} />
				</div>
				<div class="space-y-1.5 sm:col-span-2">
					<Label>توضیح</Label>
					<textarea class="min-h-[70px] w-full rounded-xl border px-3 py-2 text-sm" bind:value={description}></textarea>
				</div>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={isActive} />
					فعال
				</label>
			</CardContent>
		</Card>

		<Card class="rounded-2xl shadow-sm">
			<CardHeader class="flex flex-row items-center justify-between">
				<div>
					<CardTitle class="text-base">سوالات</CardTitle>
					<CardDescription>برای هر سوال چند گزینه با نمره تعریف کنید</CardDescription>
				</div>
				<Button size="sm" class="rounded-lg" onclick={addQuestion}>
					<Plus class="ml-1 h-4 w-4" />
					سوال
				</Button>
			</CardHeader>
			<CardContent class="space-y-4">
				{#each questions as q, qi}
					<div class="rounded-xl border p-3 space-y-2">
						<div class="flex items-start gap-2">
							<span class="mt-2 text-xs text-muted-foreground">{qi + 1}</span>
							<textarea
								class="min-h-[60px] flex-1 rounded-xl border px-3 py-2 text-sm"
								bind:value={q.question_text}
								placeholder="متن سوال"
							></textarea>
							<Button variant="ghost" size="sm" class="text-destructive" onclick={() => removeQuestion(qi)}>
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
						{#each q.options_json as opt, oi}
							<div class="flex items-center gap-2 pr-6">
								<Input class="flex-1" bind:value={opt.text} placeholder="متن گزینه" />
								<Input
									class="w-20"
									type="number"
									bind:value={opt.scores.score}
									dir="ltr"
									aria-label="نمره"
								/>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => {
										q.options_json = q.options_json.filter((_, i) => i !== oi);
									}}
								>
									<Trash2 class="h-3.5 w-3.5" />
								</Button>
							</div>
						{/each}
						<Button variant="outline" size="sm" class="rounded-lg" onclick={() => addOption(qi)}>
							گزینه جدید
						</Button>
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
				<Button size="sm" class="rounded-lg" onclick={addRule}>
					<Plus class="ml-1 h-4 w-4" />
					بازه
				</Button>
			</CardHeader>
			<CardContent class="space-y-3">
				{#each scoringRules as rule, ri}
					<div class="grid gap-2 rounded-xl border p-3 sm:grid-cols-4">
						<div class="space-y-1">
							<Label class="text-xs">از</Label>
							<Input type="number" bind:value={rule.min} dir="ltr" />
						</div>
						<div class="space-y-1">
							<Label class="text-xs">تا</Label>
							<Input type="number" bind:value={rule.max} dir="ltr" />
						</div>
						<div class="space-y-1 sm:col-span-2">
							<Label class="text-xs">برچسب</Label>
							<div class="flex gap-2">
								<Input bind:value={rule.label} />
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
							</div>
						</div>
						<div class="space-y-1 sm:col-span-4">
							<Label class="text-xs">تفسیر</Label>
							<textarea
								class="min-h-[60px] w-full rounded-xl border px-3 py-2 text-sm"
								bind:value={rule.interpretation}
							></textarea>
						</div>
					</div>
				{/each}
			</CardContent>
		</Card>
	{/if}
</div>
