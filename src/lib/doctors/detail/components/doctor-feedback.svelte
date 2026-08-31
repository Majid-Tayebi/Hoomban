<script lang="ts">
	import type { DoctorFeedback } from '../types';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { Star } from '@lucide/svelte';

	let { feedback }: { feedback: DoctorFeedback[] } = $props();
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="pb-2 pt-4 px-4 sm:px-5">
		<CardTitle class="text-sm font-semibold sm:text-base">بازخورد بیماران</CardTitle>
	</CardHeader>
	<CardContent class="space-y-3 px-4 pb-4 sm:px-5">
		{#each feedback as item (item.id)}
			<div class="rounded-xl border border-border/50 p-3">
				<div class="flex items-center justify-between gap-2">
					<p class="text-sm font-medium">{item.patientName}</p>
					<span class="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
						<Star class="h-3.5 w-3.5 fill-current" />
						{item.rating.toLocaleString('fa-IR')}
					</span>
				</div>
				<p class="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
				<p class="mt-1.5 text-[10px] text-muted-foreground">{item.date}</p>
			</div>
		{/each}
	</CardContent>
</Card>
