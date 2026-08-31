<script lang="ts">
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils';

	export type MetricTone = 'primary' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet';

	let {
		label,
		value,
		formattedValue,
		subtext,
		icon,
		tone = 'primary'
	}: {
		label: string;
		value?: number;
		formattedValue?: string;
		subtext?: string;
		icon: Component;
		tone?: MetricTone;
	} = $props();

	const tones: Record<MetricTone, { stripe: string; iconWrap: string }> = {
		primary: {
			stripe: 'bg-primary',
			iconWrap: 'bg-primary/10 text-primary ring-primary/15'
		},
		sky: {
			stripe: 'bg-sky-500',
			iconWrap: 'bg-sky-500/10 text-sky-600 ring-sky-500/15 dark:text-sky-400'
		},
		emerald: {
			stripe: 'bg-emerald-500',
			iconWrap: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 dark:text-emerald-400'
		},
		amber: {
			stripe: 'bg-amber-500',
			iconWrap: 'bg-amber-500/10 text-amber-700 ring-amber-500/15 dark:text-amber-400'
		},
		rose: {
			stripe: 'bg-rose-500',
			iconWrap: 'bg-rose-500/10 text-rose-600 ring-rose-500/15 dark:text-rose-400'
		},
		violet: {
			stripe: 'bg-violet-500',
			iconWrap: 'bg-violet-500/10 text-violet-600 ring-violet-500/15 dark:text-violet-400'
		}
	};

	const style = $derived(tones[tone]);
	const display = $derived(
		formattedValue ?? (value != null ? value.toLocaleString('fa-IR') : '—')
	);
	const valueSizeClass = $derived(
		display.length > 14 ? 'text-base sm:text-lg' : display.length > 10 ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
	);
	const Icon = $derived(icon);
</script>

<article
	class="group relative overflow-hidden rounded-2xl border border-border/55 bg-card shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-border hover:shadow-md"
>
	<div class={cn('absolute inset-y-0 start-0 w-1', style.stripe)} aria-hidden="true"></div>
	<div class="flex min-w-0 flex-col p-4 ps-5 sm:p-4 sm:ps-5">
		<div class="flex min-w-0 items-start justify-between gap-2">
			<p class="min-w-0 flex-1 text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
				{label}
			</p>
			<div
				class={cn(
					'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-200 group-hover:scale-105 sm:h-9 sm:w-9',
					style.iconWrap
				)}
			>
				<Icon class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
			</div>
		</div>

		<p
			class={cn(
				'mt-2.5 min-w-0 font-bold leading-tight tabular-nums tracking-tight break-words',
				valueSizeClass
			)}
		>
			{display}
		</p>

		{#if subtext}
			<p class="mt-1.5 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{subtext}</p>
		{/if}
	</div>
</article>
