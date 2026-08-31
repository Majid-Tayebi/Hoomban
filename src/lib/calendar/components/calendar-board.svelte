<script lang="ts">
	import type { AuthUser } from '$lib/auth.svelte';
	import type { CalendarDayCell, CalendarFilterMode, CalendarView, ScheduleEvent } from '../types';
	import {
		buildMonthGrid,
		filterEvents,
		eventsOnDay,
		parseIsoDate,
		startOfWeek,
		addMonths,
		weekDays,
		toIsoDate,
		startOfMonth
	} from '../utils/calendar-grid';
	import { loadCalendarPageData, monthKey } from '../services/calendar-data';
	import { addDays, startOfDay } from '$lib/date';
	import CalendarToolbar from './calendar-toolbar.svelte';
	import CalendarMonthGrid from './calendar-month-grid.svelte';
	import CalendarWeekView from './calendar-week-view.svelte';
	import CalendarDayView from './calendar-day-view.svelte';
	import CalendarEventModal from './calendar-event-modal.svelte';
	import CalendarDetailsPanel from './calendar-details-panel.svelte';
	import { cn } from '$lib/utils';

	let { user }: { user: NonNullable<AuthUser> } = $props();

	const canBook = $derived(user.role === 'secretary' || user.role === 'admin');
	let bookingOpen = $state(false);
	let bookingSession = $state(0);
	let BookingModalCmp = $state<typeof import('$lib/appointments/components/booking-modal.svelte').default | null>(
		null
	);

	const FILTER_TABS: { id: CalendarFilterMode; label: string }[] = [
		{ id: 'all', label: 'همه نوبت‌ها' },
		{ id: 'appointment', label: 'نوبت بیمار' },
		{ id: 'service', label: 'نوبت خدمات' }
	];

	let cursor = $state(startOfDay(new Date()));
	let view = $state<CalendarView>('month');
	let selectedDate = $state(startOfDay(new Date()));
	let filterMode = $state<CalendarFilterMode>('all');
	let detailsOpen = $state(false);
	let eventModalOpen = $state(false);
	let selectedEvent = $state<ScheduleEvent | null>(null);
	let loading = $state(true);
	let monthEvents = $state<ScheduleEvent[]>([]);
	let loadedKey = $state('');

	async function reload(anchor: Date) {
		const key = monthKey(anchor);
		loading = true;
		try {
			const data = await loadCalendarPageData(anchor);
			monthEvents = data.events;
			loadedKey = key;
		} catch {
			monthEvents = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const key = monthKey(cursor);
		if (key !== loadedKey) {
			void reload(cursor);
		}
	});

	const filtered = $derived(filterEvents(monthEvents, filterMode));
	const monthCells = $derived(buildMonthGrid(cursor, filtered));
	const weekCells = $derived(weekDays(cursor, filtered));
	const dayEvents = $derived(eventsOnDay(filtered, selectedDate));
	const selectedIso = $derived(toIsoDate(selectedDate));

	function selectDay(cell: CalendarDayCell) {
		selectedDate = cell.date;
		if (view === 'month' && !cell.inCurrentMonth) {
			cursor = startOfMonth(cell.date);
		}
		detailsOpen = true;
	}

	function selectEvent(ev: ScheduleEvent) {
		selectedDate = parseIsoDate(ev.date);
		selectedEvent = ev;
		eventModalOpen = true;
	}

	function onPrev() {
		if (view === 'month') cursor = addMonths(cursor, -1);
		else if (view === 'week') {
			cursor = addDays(startOfWeek(cursor), -7);
			selectedDate = cursor;
		} else {
			selectedDate = addDays(selectedDate, -1);
			cursor = selectedDate;
		}
	}

	function onNext() {
		if (view === 'month') cursor = addMonths(cursor, 1);
		else if (view === 'week') {
			cursor = addDays(startOfWeek(cursor), 7);
			selectedDate = cursor;
		} else {
			selectedDate = addDays(selectedDate, 1);
			cursor = selectedDate;
		}
	}

	function onToday() {
		const t = startOfDay(new Date());
		cursor = t;
		selectedDate = t;
	}

	function onViewChange(v: CalendarView) {
		view = v;
		if (v === 'day' || v === 'week') cursor = selectedDate;
	}

	async function onNewEvent() {
		if (!BookingModalCmp) {
			const mod = await import('$lib/appointments/components/booking-modal.svelte');
			BookingModalCmp = mod.default;
		}
		bookingSession += 1;
		bookingOpen = true;
	}

	async function onBooked() {
		await reload(cursor);
	}
</script>

<div class="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
	<div class="flex flex-wrap gap-2 border-b border-border/60 px-4 py-3 sm:px-5">
		{#each FILTER_TABS as tab}
			<button
				type="button"
				class={cn(
					'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:text-sm',
					filterMode === tab.id
						? 'bg-foreground text-background shadow-sm'
						: 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
				)}
				onclick={() => (filterMode = tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<div class="p-4 sm:p-5">
		<CalendarToolbar
			{cursor}
			{view}
			{onPrev}
			{onNext}
			{onToday}
			{onViewChange}
			onNewEvent={canBook ? onNewEvent : undefined}
		/>

		{#if loading && !monthEvents.length}
			<p class="py-16 text-center text-sm text-muted-foreground">در حال بارگذاری…</p>
		{:else}
			<div class="mt-4">
				{#if view === 'month'}
					<CalendarMonthGrid
						cells={monthCells}
						{selectedIso}
						onSelectDay={selectDay}
						onSelectEvent={selectEvent}
					/>
				{:else if view === 'week'}
					<CalendarWeekView days={weekCells} onSelectDay={selectDay} onSelectEvent={selectEvent} />
				{:else}
					<CalendarDayView date={selectedDate} events={dayEvents} onSelectEvent={selectEvent} />
				{/if}
			</div>
		{/if}
	</div>
</div>

<CalendarEventModal bind:open={eventModalOpen} bind:event={selectedEvent} />

{#if canBook && BookingModalCmp}
	<BookingModalCmp bind:open={bookingOpen} {user} sessionKey={bookingSession} onBooked={onBooked} />
{/if}

{#if detailsOpen}
	<div class="fixed inset-0 z-40 xl:hidden">
		<button
			type="button"
			class="absolute inset-0 bg-foreground/30"
			aria-label="بستن جزئیات"
			onclick={() => (detailsOpen = false)}
		></button>
		<div class="absolute inset-x-3 bottom-3 top-[18%] overflow-hidden sm:inset-x-8 sm:top-[12%]">
			<CalendarDetailsPanel
				events={dayEvents}
				title="نوبت‌های روز"
				onClose={() => (detailsOpen = false)}
				onSelectEvent={(ev) => {
					detailsOpen = false;
					selectEvent(ev);
				}}
			/>
		</div>
	</div>
{/if}
