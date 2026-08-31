<script lang="ts">
	import type { HealthReport } from '../types';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { FileText, Download, MoreVertical } from '@lucide/svelte';

	let { reports }: { reports: HealthReport[] } = $props();
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4 sm:px-5">
		<CardTitle class="text-sm font-semibold sm:text-base">گزارش‌های سلامت</CardTitle>
		<button type="button" class="rounded-lg p-1.5 hover:bg-muted" aria-label="گزینه‌ها">
			<MoreVertical class="h-4 w-4 text-muted-foreground" />
		</button>
	</CardHeader>
	<CardContent class="space-y-2 px-4 pb-4 sm:px-5">
		{#each reports as report (report.id)}
			<div class="flex items-center gap-3 rounded-xl border border-border/50 p-3">
				<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<FileText class="h-4 w-4" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{report.title}</p>
					<p class="text-[11px] text-muted-foreground">{report.date} · {report.size}</p>
				</div>
				<button type="button" class="rounded-lg p-2 hover:bg-muted" aria-label="دانلود">
					<Download class="h-4 w-4 text-muted-foreground" />
				</button>
			</div>
		{/each}
	</CardContent>
</Card>
