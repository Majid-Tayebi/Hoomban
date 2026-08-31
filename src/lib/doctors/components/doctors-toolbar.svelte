<script lang="ts">
	import type { DoctorFilters } from '../types';
	import Button from '$lib/components/ui/button.svelte';
	import { Filter, Plus } from '@lucide/svelte';

	let {
		filters = $bindable(),
		specialties = ['همه'],
		onAdd
	}: {
		filters: DoctorFilters;
		specialties?: string[];
		onAdd?: () => void;
	} = $props();

	const selectClass =
		'h-9 rounded-xl border border-border/60 bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
</script>

<div class="space-y-3">
	<!-- Top actions -->
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				class="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground hover:bg-muted"
				aria-label="فیلتر"
			>
				<Filter class="h-4 w-4" />
			</button>
			<select class={selectClass} bind:value={filters.status} aria-label="وضعیت">
				<option value="all">همه وضعیت‌ها</option>
				<option value="available">آماده</option>
				<option value="unavailable">غیرفعال</option>
			</select>
		</div>
		<Button class="h-9 rounded-xl px-3 text-sm" onclick={() => onAdd?.()}>
			<Plus class="ml-1 h-4 w-4" />
			افزودن متخصص
		</Button>
	</div>

	<!-- Specialty tabs (desktop/tablet) -->
	<div class="hidden gap-1 overflow-x-auto border-b border-border/60 pb-px sm:flex">
		{#each specialties as spec}
			<button
				type="button"
				class="shrink-0 px-3 py-2 text-xs font-medium transition-colors {filters.specialty === spec ||
				(spec === 'همه' && (filters.specialty === 'all' || filters.specialty === 'همه'))
					? 'border-b-2 border-primary text-primary'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (filters.specialty = spec)}
			>
				{spec}
			</button>
		{/each}
	</div>

	<!-- Mobile chips -->
	<div class="flex gap-2 overflow-x-auto pb-1 sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
		{#each [{ id: 'all', label: 'همه' }, { id: 'available', label: 'آماده' }, ...specialties.filter((s) => s !== 'همه').slice(0, 4).map((s) => ({ id: s, label: s }))] as chip}
			<button
				type="button"
				class="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors {chip.id === 'available'
					? filters.status === 'available'
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground'
					: filters.specialty === chip.id || (chip.id === 'all' && (filters.specialty === 'همه' || filters.specialty === 'all'))
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground'}"
				onclick={() => {
					if (chip.id === 'available') {
						filters.status = filters.status === 'available' ? 'all' : 'available';
					} else if (chip.id === 'all') {
						filters.specialty = 'همه';
						filters.status = 'all';
					} else {
						filters.specialty = chip.id;
					}
				}}
			>
				{chip.label}
			</button>
		{/each}
	</div>
</div>
