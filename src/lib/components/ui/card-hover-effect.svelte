<script lang="ts">
	import { cn } from '$lib/utils';

	export type HoverEffectItem = {
		title: string;
		description: string;
		link?: string;
	};

	let {
		items,
		class: className = ''
	}: {
		items: HoverEffectItem[];
		class?: string;
	} = $props();
</script>

<div
	class={cn('grid grid-cols-1 gap-2 py-2 md:grid-cols-2 md:gap-3 lg:grid-cols-3', className)}
>
	{#each items as item, idx (item.title + idx)}
		{#if item.link}
			<a
				href={item.link}
				class="group relative block h-full w-full p-1.5 sm:p-2"
			>
				<span
					class="absolute inset-0 block h-full w-full rounded-3xl bg-muted/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:bg-muted/40"
					aria-hidden="true"
				></span>
				<div
					class="relative z-10 h-full overflow-hidden rounded-2xl border border-border/50 bg-card p-4 transition-colors duration-200 group-hover:border-primary/20 sm:p-5"
				>
					<h4 class="text-sm font-bold tracking-tight text-foreground sm:text-base">
						{item.title}
					</h4>
					<p class="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
						{item.description}
					</p>
				</div>
			</a>
		{:else}
			<div class="group relative block h-full w-full p-1.5 sm:p-2">
				<span
					class="absolute inset-0 block h-full w-full rounded-3xl bg-muted/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:bg-muted/40"
					aria-hidden="true"
				></span>
				<div
					class="relative z-10 h-full overflow-hidden rounded-2xl border border-border/50 bg-card p-4 transition-colors duration-200 group-hover:border-primary/20 sm:p-5"
				>
					<h4 class="text-sm font-bold tracking-tight text-foreground sm:text-base">
						{item.title}
					</h4>
					<p class="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
						{item.description}
					</p>
				</div>
			</div>
		{/if}
	{/each}
</div>
