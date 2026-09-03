<script lang="ts">
	import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
	import { getErrorMessage } from '$lib/errors';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import NeoScoringConfigPanel from '$lib/tests/components/neo-scoring-config-panel.svelte';
	import NeoKeyImportPanel from '$lib/tests/components/neo-key-import-panel.svelte';
	import { syncNeoPsychQuestionsApi } from '$lib/tests/services/psych-questions-api';
	import { NEO_DOMAINS, NEO_FACETS } from '$lib/psych/neo-240/meta';
	import {
		DEFAULT_NEO_SCORING_CONFIG,
		parseNeoScoringConfig,
		type NeoScoringConfig
	} from '$lib/psych/neo-240/scoring-config';
	import {
		formatNeoKeyCompact,
		formatNeoQuestionKeys,
		parseNeoKeyCompact,
		parseNeoQuestionKeys
	} from '$lib/psych/neo-240/parse-question-keys';
	import type { NeoQuestion } from '$lib/psych/neo-240/types';
	import {
		applyScorePattern,
		clampNeoScore,
		isReversePattern,
		NEO_FORWARD_SCORES,
		NEO_REVERSE_SCORES,
		parseQuestionOptions,
		syncOptionLabels,
		type NeoQuestionOption
	} from '$lib/psych/neo-240/option-scores';
	import { ChevronLeft, ChevronRight, Save } from '@lucide/svelte';

	function likertLabels() {
		return scoringConfig.likert.length === 5
			? scoringConfig.likert
			: DEFAULT_NEO_SCORING_CONFIG.likert;
	}

	function normalizeQuestion(
		q: Record<string, unknown>,
		labels: string[]
	): NeoQuestion {
		const reverseScored = Boolean(q.reverse_scored);
		return {
			id: q.id as string | undefined,
			order: Number(q.order),
			question_text: String(q.question_text || ''),
			domain_key: String(q.domain_key || 'N'),
			facet_key: String(q.facet_key || 'N1'),
			options_json: syncOptionLabels(
				parseQuestionOptions(q.options_json, labels, reverseScored),
				labels
			)
		};
	}

	function applyScorePatternToQuestion(q: NeoQuestion, reverse: boolean) {
		q.options_json = applyScorePattern(
			q.options_json,
			reverse ? NEO_REVERSE_SCORES : NEO_FORWARD_SCORES
		);
	}

	function setOptionScore(q: NeoQuestion, optionIndex: number, raw: string) {
		const value = clampNeoScore(raw);
		q.options_json = q.options_json.map((opt, i) =>
			i === optionIndex ? { ...opt, scores: { value, score: value } } : opt
		);
	}

	let {
		testId,
		readonly = false,
		onmessage
	}: {
		testId: string;
		readonly?: boolean;
		onmessage?: (text: string) => void;
	} = $props();

	let questions = $state<NeoQuestion[]>([]);
	let scoringConfig = $state<Required<NeoScoringConfig>>({ ...DEFAULT_NEO_SCORING_CONFIG });
	let pageIndex = $state(0);
	let search = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let keyImportText = $state('');
	let keyImportMessage = $state('');
	let showKeyPanel = $state(false);
	const pageSize = 15;

	const filtered = $derived(
		search.trim()
			? questions.filter((q) => q.question_text.includes(search.trim()) || String(q.order) === search.trim())
			: questions
	);
	const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
	const pageQuestions = $derived(
		filtered.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
	);

	function notify(text: string) {
		onmessage?.(text);
	}

	async function loadQuestions() {
		loading = true;
		try {
			const t = await pb.collection('psych_tests').getOne(testId, PB_NO_AUTO_CANCEL);
			scoringConfig = parseNeoScoringConfig(t.scoring_config);

			const result = await pb.collection('psych_questions').getFullList({
				filter: `test = "${testId}"`,
				sort: 'order',
				...PB_NO_AUTO_CANCEL
			});
			questions = result.map((q) => normalizeQuestion(q, likertLabels()));
		} catch (e: unknown) {
			notify(getErrorMessage(e, 'خطا در بارگذاری سوالات نئو'));
		} finally {
			loading = false;
		}
	}

	function facetsForDomain(domain: string) {
		return NEO_FACETS.filter((f) => f.domain === domain);
	}

	function applyImportedKeys() {
		keyImportMessage = '';
		const { rows, errors } = parseNeoQuestionKeys(keyImportText);
		if (!rows.length) {
			keyImportMessage = errors.length ? errors.slice(0, 3).join(' — ') : 'کلیدی شناسایی نشد';
			return;
		}
		const byOrder = new Map(rows.map((r) => [r.order, r]));
		let applied = 0;
		for (const q of questions) {
			const row = byOrder.get(q.order);
			if (!row) continue;
			q.facet_key = row.facet_key;
			q.domain_key = row.domain_key;
			applyScorePatternToQuestion(q, row.reverse_scored);
			applied++;
		}
		questions = [...questions];
		keyImportMessage = `${applied} سوال به‌روز شد${errors.length ? ` — ${errors.length} خطا` : ''}`;
		if (errors.length) notify(errors.slice(0, 5).join('\n'));
	}

	function exportKeys() {
		keyImportText = formatNeoQuestionKeys(
			questions.map((q) => ({
				order: q.order,
				facet_key: q.facet_key,
				reverse_scored: isReversePattern(q.options_json)
			}))
		);
		keyImportMessage = 'کلید فعلی در کادر زیر کپی شد';
		showKeyPanel = true;
	}

	function applyCompactKey(q: NeoQuestion, raw: string) {
		const parsed = parseNeoKeyCompact(raw);
		if (!parsed) return;
		q.facet_key = parsed.facet_key;
		q.domain_key = parsed.domain_key;
		applyScorePatternToQuestion(q, parsed.reverse_scored);
		questions = [...questions];
	}

	async function saveAll() {
		if (readonly) return;
		saving = true;
		try {
			await syncNeoPsychQuestionsApi(
				pb.authStore.token,
				testId,
				questions,
				scoringConfig,
				likertLabels()
			);
			notify('سوالات و تنظیمات نمره‌دهی نئو ذخیره شد');
		} catch (e: unknown) {
			notify(getErrorMessage(e, 'خطا در ذخیره — فقط نقش نویسنده مجاز است'));
		} finally {
			saving = false;
		}
	}

	$effect(() => {
		if (testId) void loadQuestions();
	});
</script>

{#if loading}
	<p class="py-8 text-center text-sm text-muted-foreground">در حال بارگذاری ۲۴۰ سوال...</p>
{:else}
	<div class="space-y-4">
		{#if readonly}
			<p class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
				حالت مشاهده — برای ویرایش با حساب نویسنده وارد شوید.
			</p>
		{/if}

		<NeoScoringConfigPanel bind:scoringConfig {readonly} />

		<NeoKeyImportPanel
			bind:keyImportText
			bind:keyImportMessage
			bind:showKeyPanel
			{readonly}
			onApply={applyImportedKeys}
			onExport={exportKeys}
		/>

		<Card class="rounded-2xl shadow-sm">
			<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2">
				<div>
					<CardTitle class="text-base">سوالات ({questions.length})</CardTitle>
					<CardDescription>ویرایش متن، عامل، خرده‌مقیاس و نمره هر گزینه (مطابق کلید NEOPI-R)</CardDescription>
				</div>
				{#if !readonly}
					<Button size="sm" class="rounded-lg" disabled={saving} onclick={saveAll}>
						<Save class="ms-1 h-4 w-4" />
						{saving ? 'ذخیره...' : 'ذخیره سوالات و نمره‌دهی'}
					</Button>
				{/if}
			</CardHeader>
			<CardContent class="space-y-3">
				<Input bind:value={search} placeholder="جستجو بر اساس شماره یا متن سوال..." disabled={readonly} />

				{#each pageQuestions as q (q.id ?? q.order)}
					<div class="rounded-xl border p-3 space-y-2">
						<div class="flex flex-wrap items-center gap-2">
							<Badge class="text-[10px]">سوال {q.order}</Badge>
							<select
								class="h-9 rounded-lg border bg-background px-2 text-xs"
								bind:value={q.domain_key}
								disabled={readonly}
								onchange={() => {
									const first = facetsForDomain(q.domain_key)[0];
									if (first) q.facet_key = first.key;
								}}
							>
								{#each NEO_DOMAINS as d (d.key)}
									<option value={d.key}>{d.key} — {d.label}</option>
								{/each}
							</select>
							<select
								class="h-9 rounded-lg border bg-background px-2 text-xs"
								bind:value={q.facet_key}
								disabled={readonly}
							>
								{#each facetsForDomain(q.domain_key) as f (f.key)}
									<option value={f.key}>{f.key} — {f.label}</option>
								{/each}
							</select>
							<div class="flex items-center gap-1">
								<Label class="sr-only">کلید فشرده</Label>
								<Input
									class="h-9 w-24 font-mono text-xs"
									dir="ltr"
									value={formatNeoKeyCompact(q.facet_key, isReversePattern(q.options_json))}
									disabled={readonly}
									placeholder="N1+"
									onchange={(e: Event) => {
										applyCompactKey(q, (e.currentTarget as HTMLInputElement).value);
									}}
								/>
							</div>
							{#if !readonly}
								<Button
									type="button"
									variant="outline"
									size="sm"
									class="h-9 rounded-lg px-2 text-[10px]"
									onclick={() => {
										applyScorePatternToQuestion(q, false);
										questions = [...questions];
									}}
								>
									مستقیم
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									class="h-9 rounded-lg px-2 text-[10px]"
									onclick={() => {
										applyScorePatternToQuestion(q, true);
										questions = [...questions];
									}}
								>
									معکوس
								</Button>
							{/if}
						</div>
						<textarea
							class="min-h-[60px] w-full rounded-xl border px-3 py-2 text-sm"
							bind:value={q.question_text}
							disabled={readonly}
						></textarea>
						<div class="overflow-x-auto rounded-xl border bg-muted/20">
							<table class="w-full min-w-[320px] text-xs">
								<thead>
									<tr class="border-b bg-muted/40 text-muted-foreground">
										<th class="px-3 py-2 text-right font-medium">گزینه</th>
										<th class="w-20 px-2 py-2 text-center font-medium">نمره</th>
									</tr>
								</thead>
								<tbody>
									{#each q.options_json as opt, oi (oi)}
										<tr class="border-b border-border/50 last:border-0">
											<td class="px-3 py-2 text-foreground">{opt.text}</td>
											<td class="px-2 py-1.5">
												<Input
													type="number"
													min="0"
													max="4"
													step="1"
													class="h-8 text-center font-mono text-xs"
													dir="ltr"
													value={String(opt.scores.value ?? opt.scores.score ?? oi)}
													disabled={readonly}
													oninput={(e: Event) => {
														setOptionScore(
															q,
															oi,
															(e.currentTarget as HTMLInputElement).value
														);
														questions = [...questions];
													}}
												/>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/each}

				<div class="flex items-center justify-between gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						class="rounded-lg"
						disabled={pageIndex === 0}
						onclick={() => (pageIndex -= 1)}
					>
						<ChevronRight class="ms-1 h-4 w-4" />
						قبلی
					</Button>
					<span class="text-xs text-muted-foreground">صفحه {pageIndex + 1} از {totalPages}</span>
					<Button
						variant="outline"
						size="sm"
						class="rounded-lg"
						disabled={pageIndex >= totalPages - 1}
						onclick={() => (pageIndex += 1)}
					>
						بعدی
						<ChevronLeft class="ms-1 h-4 w-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
{/if}
