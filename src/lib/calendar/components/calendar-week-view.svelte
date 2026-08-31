<script lang="ts">
	import type { CalendarDayCell, ScheduleEvent } from '../types';
	import {
		WEEKDAYS_FA,
		CATEGORY_META,
		categoryToneClass
	} from '../utils/calendar-grid';
	import { hoursRange, formatFaDigits } from '$lib/date';

	let {
		days,
		onSelectDay,
		onSelectEvent
	}: {
		days: CalendarDayCell[];
		onSelectDay: (cell: CalendarDayCell) => void;
		onSelectEvent?: (event: ScheduleEvent) => void;
	} = $props();

	const hours = hoursRange(8, 18);

	function eventsAtHour(events: ScheduleEvent[], hour: number) {
		return events.filter((e) => Number(e.startTime.split(':')[0]) === hour);
	}
</script>

<div class="overflow-x-auto rounded-2xl border bg-card">
	<div class="min-w-[640px]">
		<div class="grid grid-cols-8 border-b bg-muted/40">
			<div class="px-2 py-2 text-center text-[11px] text-muted-foreground">ساعت</div>
			{#each days as day, i}
				<button
					type="button"
					class="border-r px-1 py-2 text-center hover:bg-accent/40
						{day.isToday ? 'bg-primary/10' : ''}"
					onclick={() => onSelectDay(day)}
				>
					<p class="text-[10px] text-muted-foreground sm:text-[11px]">{WEEKDAYS_FA[i]}</p>
					<p class="text-sm font-semibold {day.isToday ? 'text-primary' : ''}">
						{formatFaDigits(day.day)}
					</p>
				</button>
			{/each}
		</div>

		{#each hours as hour}
			<div class="grid grid-cols-8 border-b last:border-b-0">
				<div class="px-2 py-3 text-center text-[11px] text-muted-foreground" dir="ltr">
					{String(hour).padStart(2, '0')}:00
				</div>
				{#each days as day}
					{@const slot = eventsAtHour(day.events, hour)}
					<div class="min-h-[3.25rem] border-r p-1 align-top">
						{#each slot as ev (ev.id)}
							<button
								type="button"
								class="mb-1 w-full truncate rounded-lg border px-1.5 py-1 text-right text-[10px] leading-tight
									{categoryToneClass(CATEGORY_META[ev.category].tone).chip}"
								onclick={() => onSelectEvent?.(ev)}
							>
								<span class="block font-medium">{ev.title}</span>
								<span dir="ltr" class="opacity-80">{ev.startTime}–{ev.endTime}</span>
							</button>
						{/each}
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>
