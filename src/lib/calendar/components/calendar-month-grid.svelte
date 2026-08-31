<script lang="ts">
	import type { CalendarDayCell, ScheduleEvent } from '../types';
	import {
		WEEKDAYS_FA,
		CATEGORY_META,
		categoryToneClass
	} from '../utils/calendar-grid';
	import { formatFaDigits } from '$lib/date';

	let {
		cells,
		selectedIso,
		maxVisible = 3,
		onSelectDay,
		onSelectEvent
	}: {
		cells: CalendarDayCell[];
		selectedIso: string | null;
		maxVisible?: number;
		onSelectDay: (cell: CalendarDayCell) => void;
		onSelectEvent?: (event: ScheduleEvent) => void;
	} = $props();

	function chipClass(category: ScheduleEvent['category']) {
		return categoryToneClass(CATEGORY_META[category].tone).chip;
	}

	function dotClass(category: ScheduleEvent['category']) {
		return categoryToneClass(CATEGORY_META[category].tone).dot;
	}
</script>

<div class="overflow-hidden rounded-xl border border-border/70 bg-background">
	<div class="grid grid-cols-7 border-b border-border/70 bg-muted/20">
		{#each WEEKDAYS_FA as label}
			<div class="px-1 py-2.5 text-center text-[10px] font-medium text-muted-foreground sm:px-2 sm:text-xs">
				{label}
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-7">
		{#each cells as cell (cell.iso)}
			{@const selected = selectedIso === cell.iso}
			<div
				role="button"
				tabindex="0"
				class="group flex min-h-[5.5rem] cursor-pointer flex-col border-b border-s border-border/60 p-1.5 text-right transition-colors duration-200 sm:min-h-[7.5rem] sm:p-2
					{cell.inCurrentMonth ? 'bg-background' : 'bg-muted/15'}
					{selected ? 'bg-primary/5 ring-2 ring-inset ring-primary/30' : 'hover:bg-muted/30'}"
				onclick={() => onSelectDay(cell)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onSelectDay(cell);
					}
				}}
			>
				<div class="mb-1 flex justify-end">
					<span
						class="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] tabular-nums sm:text-xs
							{cell.isToday ? 'bg-foreground font-semibold text-background' : ''}
							{!cell.inCurrentMonth ? 'text-muted-foreground/45' : 'text-foreground'}"
					>
						{formatFaDigits(cell.day)}
					</span>
				</div>

				<div class="hidden min-w-0 flex-1 space-y-1 sm:block">
					{#each cell.events.slice(0, maxVisible) as ev (ev.id)}
						<button
							type="button"
							class="flex w-full min-w-0 items-center gap-1.5 truncate rounded-md border px-1.5 py-1 text-[10px] leading-tight transition-colors duration-200 hover:brightness-95 sm:text-[11px] {chipClass(ev.category)}"
							onclick={(e) => {
								e.stopPropagation();
								onSelectEvent?.(ev);
							}}
						>
							<span class="h-1.5 w-1.5 shrink-0 rounded-full {dotClass(ev.category)}"></span>
							<span class="min-w-0 flex-1 truncate text-start font-medium">{ev.title}</span>
							<span class="shrink-0 tabular-nums opacity-80" dir="ltr">{ev.startTime}</span>
						</button>
					{/each}
					{#if cell.events.length > maxVisible}
						<button
							type="button"
							class="w-full px-1 py-0.5 text-start text-[10px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground sm:text-[11px]"
							onclick={(e) => {
								e.stopPropagation();
								onSelectDay(cell);
							}}
						>
							{formatFaDigits(cell.events.length - maxVisible)} مورد دیگر…
						</button>
					{/if}
				</div>

				<div class="mt-auto flex flex-wrap justify-end gap-0.5 pt-1 sm:hidden">
					{#each cell.events.slice(0, 4) as ev (ev.id)}
						<span class="h-1.5 w-1.5 rounded-full {dotClass(ev.category)}"></span>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
