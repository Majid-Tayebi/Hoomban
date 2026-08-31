<script lang="ts">
	import type { AppointmentTypeSlice } from '../types';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';

	let { types }: { types: AppointmentTypeSlice[] } = $props();
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="pb-2 pt-4 px-4 sm:px-5">
		<CardTitle class="text-sm font-semibold sm:text-base">نوع نوبت</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4 px-4 pb-4 sm:px-5">
		<ul class="space-y-3">
			{#each types as item (item.key)}
				<li class="flex items-center justify-between gap-3 text-sm">
					<div class="flex items-center gap-2.5">
						<span class="h-3 w-3 shrink-0 rounded-full" style="background-color: {item.color}"></span>
						<span class="font-medium">{item.label}</span>
					</div>
					<div class="text-left text-xs text-muted-foreground">
						<span class="font-semibold text-foreground">{item.percent}%</span>
						<span class="mx-1">·</span>
						<span>{item.count.toLocaleString('fa-IR')} بیمار</span>
					</div>
				</li>
			{/each}
		</ul>

		<!-- Segmented bar visualizer -->
		<div class="flex h-3 overflow-hidden rounded-full">
			{#each types as item (item.key)}
				<div class="h-full transition-all" style="width: {item.percent}%; background-color: {item.color}"></div>
			{/each}
		</div>
	</CardContent>
</Card>
