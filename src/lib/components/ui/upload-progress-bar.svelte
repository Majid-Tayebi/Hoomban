<script lang="ts">
	import Progress from '$lib/components/ui/progress.svelte';
	import { cn } from '$lib/utils';

	let {
		class: className = '',
		progress = 0,
		label = 'در حال آپلود'
	}: {
		class?: string;
		progress?: number;
		label?: string;
	} = $props();

	const pct = $derived(Math.min(100, Math.max(0, Math.round(progress))));
</script>

<div class={cn('space-y-2', className)}>
	<div class="flex items-center justify-between gap-3 text-sm">
		<span class="text-muted-foreground">{label}</span>
		<span class="font-medium tabular-nums text-foreground">{pct.toLocaleString('fa-IR')}%</span>
	</div>
	<Progress value={pct} class="h-1.5" />
</div>
