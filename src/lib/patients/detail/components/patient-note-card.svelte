<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { MoreVertical } from '@lucide/svelte';

	let {
		doctorName,
		date,
		text
	}: {
		doctorName: string;
		date: string;
		text: string;
	} = $props();
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4 sm:px-5">
		<div>
			<CardTitle class="text-sm font-semibold sm:text-base">یادداشت مراجعه</CardTitle>
			<p class="mt-0.5 text-xs text-muted-foreground">{doctorName} · {date}</p>
		</div>
		<button type="button" class="rounded-lg p-1.5 hover:bg-muted" aria-label="گزینه‌ها">
			<MoreVertical class="h-4 w-4 text-muted-foreground" />
		</button>
	</CardHeader>
	<CardContent class="px-4 pb-4 sm:px-5">
		<div class="rounded-xl bg-muted/50 p-3 text-sm leading-relaxed text-foreground/90">
			{text}
		</div>
	</CardContent>
</Card>
