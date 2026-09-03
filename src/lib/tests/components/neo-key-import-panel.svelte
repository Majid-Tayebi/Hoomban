<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { KeyRound, Upload } from '@lucide/svelte';

	let {
		keyImportText = $bindable(''),
		keyImportMessage = $bindable(''),
		showKeyPanel = $bindable(false),
		readonly = false,
		onApply,
		onExport
	}: {
		keyImportText?: string;
		keyImportMessage?: string;
		showKeyPanel?: boolean;
		readonly?: boolean;
		onApply: () => void;
		onExport: () => void;
	} = $props();
</script>

<Card class="rounded-2xl shadow-sm">
	<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2">
		<div>
			<CardTitle class="text-base">کلید نمره‌گذاری سوالات</CardTitle>
			<CardDescription>
				ورود دسته‌ای خرده‌مقیاس — فرمت: شماره,خرده‌مقیاس,معکوس (مثال: 1,N1,معکوس)
			</CardDescription>
		</div>
		{#if !readonly}
			<Button variant="outline" size="sm" class="rounded-lg" onclick={() => (showKeyPanel = !showKeyPanel)}>
				<KeyRound class="ms-1 h-4 w-4" />
				{showKeyPanel ? 'بستن' : 'ورود کلید'}
			</Button>
		{/if}
	</CardHeader>
	{#if showKeyPanel || readonly}
		<CardContent class="space-y-3">
			<textarea
				class="min-h-[140px] w-full rounded-xl border bg-muted/30 px-3 py-2 font-mono text-xs leading-relaxed disabled:opacity-60"
				dir="ltr"
				placeholder={"1,N1,معکوس\n2,E1,مستقیم\n3,O1,معکوس\n...\nیا: 1 N1 R"}
				bind:value={keyImportText}
				disabled={readonly}
			></textarea>
			{#if keyImportMessage}
				<p class="text-xs text-muted-foreground">{keyImportMessage}</p>
			{/if}
			{#if !readonly}
				<div class="flex flex-wrap gap-2">
					<Button size="sm" class="rounded-lg" onclick={onApply}>
						<Upload class="ms-1 h-4 w-4" />
						اعمال کلیدها
					</Button>
					<Button variant="outline" size="sm" class="rounded-lg" onclick={onExport}>
						صدور کلید فعلی
					</Button>
				</div>
			{/if}
		</CardContent>
	{/if}
</Card>
