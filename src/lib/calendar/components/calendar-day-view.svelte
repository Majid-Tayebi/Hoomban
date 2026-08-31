<script lang="ts">
	import type { ScheduleEvent } from '../types';
	import ScheduleEventCard from './schedule-event-card.svelte';
	import { formatDayMonthFa } from '../utils/calendar-grid';

	let {
		date,
		events,
		onSelectEvent
	}: {
		date: Date;
		events: ScheduleEvent[];
		onSelectEvent?: (event: ScheduleEvent) => void;
	} = $props();
</script>

<div class="rounded-2xl border bg-card p-4 sm:p-5">
	<div class="mb-4 flex items-center justify-between gap-2">
		<div>
			<h2 class="text-sm font-semibold sm:text-base">نوبت‌های روز</h2>
			<p class="mt-0.5 text-xs text-muted-foreground">{formatDayMonthFa(date)}</p>
		</div>
		<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
			{events.length.toLocaleString('fa-IR')} نوبت
		</span>
	</div>

	{#if events.length === 0}
		<p class="py-16 text-center text-sm text-muted-foreground">نوبتی برای این روز ثبت نشده است.</p>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
			{#each events as event (event.id)}
				<button
					type="button"
					class="w-full rounded-2xl text-right transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
					onclick={() => onSelectEvent?.(event)}
				>
					<ScheduleEventCard {event} />
				</button>
			{/each}
		</div>
	{/if}
</div>
