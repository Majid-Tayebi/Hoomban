<script lang="ts">
	import type { PatientFilters } from '../types';
	import { CONDITION_OPTIONS } from '../data/mock-data';
	import { Filter, ChevronDown } from '@lucide/svelte';

	let {
		filters = $bindable(),
		mobileOpen = $bindable(false)
	}: {
		filters: PatientFilters;
		mobileOpen?: boolean;
	} = $props();

	const selectClass =
		'h-9 rounded-xl border border-primary/20 bg-primary/5 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
</script>

<!-- Desktop / tablet filter chips -->
<div class="hidden flex-wrap items-center gap-2 sm:flex">
	<select class={selectClass} bind:value={filters.gender} aria-label="فیلتر جنسیت">
		<option value="all">جنسیت</option>
		<option value="male">مرد</option>
		<option value="female">زن</option>
	</select>
	<select class={selectClass} bind:value={filters.condition} aria-label="فیلتر وضعیت">
		<option value="all">وضعیت</option>
		{#each CONDITION_OPTIONS.slice(1) as c (c)}
			<option value={c}>{c}</option>
		{/each}
	</select>
</div>

<!-- Mobile filter button + panel -->
<div class="sm:hidden">
	<button
		type="button"
		class="inline-flex h-9 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 text-xs font-medium text-foreground"
		onclick={() => (mobileOpen = !mobileOpen)}
	>
		<Filter class="h-3.5 w-3.5" />
		فیلتر
		<ChevronDown class="h-3.5 w-3.5 {mobileOpen ? 'rotate-180' : ''} transition-transform" />
	</button>

	{#if mobileOpen}
		<div class="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/30 p-3">
			<select class="{selectClass} w-full" bind:value={filters.gender} aria-label="فیلتر جنسیت">
				<option value="all">جنسیت</option>
				<option value="male">مرد</option>
				<option value="female">زن</option>
			</select>
			<select class="{selectClass} w-full" bind:value={filters.condition} aria-label="فیلتر وضعیت">
				<option value="all">وضعیت</option>
				{#each CONDITION_OPTIONS.slice(1) as c (c)}
					<option value={c}>{c}</option>
				{/each}
			</select>
		</div>
	{/if}
</div>
