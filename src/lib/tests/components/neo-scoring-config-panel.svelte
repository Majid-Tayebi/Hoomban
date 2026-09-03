<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import type { NeoScoringConfig } from '$lib/psych/neo-240/scoring-config';

	let {
		scoringConfig = $bindable(),
		readonly = false
	}: {
		scoringConfig: Required<NeoScoringConfig>;
		readonly?: boolean;
	} = $props();
</script>

<Card class="rounded-2xl shadow-sm">
	<CardHeader>
		<CardTitle class="text-base">تنظیمات نمره‌دهی و گزینه‌های لیکرت</CardTitle>
		<CardDescription>بازه‌های پایین / متوسط / بالا و متن پنج گزینه پاسخ</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="grid gap-3 sm:grid-cols-2">
			<div class="space-y-2 rounded-xl border p-3">
				<p class="text-xs font-semibold">خرده‌مقیاس (۰–۳۲)</p>
				<div class="grid grid-cols-2 gap-2">
					<div>
						<Label class="text-xs">پایین تا</Label>
						<Input
							type="number"
							bind:value={scoringConfig.facetBands.lowMax}
							disabled={readonly}
							dir="ltr"
						/>
					</div>
					<div>
						<Label class="text-xs">متوسط تا</Label>
						<Input
							type="number"
							bind:value={scoringConfig.facetBands.mediumMax}
							disabled={readonly}
							dir="ltr"
						/>
					</div>
				</div>
			</div>
			<div class="space-y-2 rounded-xl border p-3">
				<p class="text-xs font-semibold">عامل اصلی (۰–۱۹۲)</p>
				<div class="grid grid-cols-2 gap-2">
					<div>
						<Label class="text-xs">پایین تا</Label>
						<Input
							type="number"
							bind:value={scoringConfig.domainBands.lowMax}
							disabled={readonly}
							dir="ltr"
						/>
					</div>
					<div>
						<Label class="text-xs">متوسط تا</Label>
						<Input
							type="number"
							bind:value={scoringConfig.domainBands.mediumMax}
							disabled={readonly}
							dir="ltr"
						/>
					</div>
				</div>
			</div>
		</div>
		<div class="space-y-2">
			<p class="text-xs font-semibold">گزینه‌های لیکرت (۰ تا ۴)</p>
			{#each scoringConfig.likert as _label, i (i)}
				<div class="flex items-center gap-2">
					<Badge variant="outline" class="w-8 shrink-0 justify-center text-[10px]">{i}</Badge>
					<Input bind:value={scoringConfig.likert[i]} disabled={readonly} />
				</div>
			{/each}
		</div>
	</CardContent>
</Card>
