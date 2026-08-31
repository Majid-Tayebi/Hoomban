<script lang="ts">
	import type { PatientVital } from '../types';
	import { Droplet, Weight, Thermometer } from '@lucide/svelte';

	let { vitals }: { vitals: PatientVital[] } = $props();

	const icons = {
		sugar: Droplet,
		weight: Weight,
		temp: Thermometer
	};
</script>

<div class="grid grid-cols-3 gap-2 sm:gap-3">
	{#each vitals as vital (vital.id)}
		{@const Icon = icons[vital.icon]}
		<article class="rounded-2xl border border-border/60 bg-card p-3 shadow-sm sm:p-4">
			<div class="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-9 sm:w-9">
				<Icon class="h-4 w-4" />
			</div>
			<p class="text-[10px] text-muted-foreground sm:text-xs">{vital.label}</p>
			<p class="mt-0.5 text-sm font-bold sm:text-base">{vital.value}</p>
		</article>
	{/each}
</div>
