<script lang="ts">
	import Calendar from '$lib/components/ui/calendar.svelte';
	import ScheduleDayPanel from '$lib/schedule/components/schedule-day-panel.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import {
		WEEKDAYS_FA,
		addDays,
		formatJalaliBirthDate,
		startOfDay,
		toIsoDateString,
		toPersianWeekdayIndex
	} from '$lib/date';
	import {
		applyPreset,
		defaultPreset,
		type WorkingDaySchedule
	} from '$lib/schedule/working-schedule';
	import {
		getDateSchedule,
		setDateSchedule,
		markedDatesFromMap,
		type DateScheduleMap
	} from '$lib/schedule/date-schedule';

	let {
		schedule = $bindable({} as DateScheduleMap),
		selectedDate = $bindable(startOfDay(new Date()))
	}: {
		schedule?: DateScheduleMap;
		selectedDate?: Date;
	} = $props();

	const markedDates = $derived(new Set(markedDatesFromMap(schedule)));
	const selectedIso = $derived(toIsoDateString(selectedDate));
	const weekdayLabel = $derived(WEEKDAYS_FA[toPersianWeekdayIndex(selectedDate)]);

	let dayDraft = $state<WorkingDaySchedule>({
		day: '',
		enabled: false,
		slots: []
	});

	$effect(() => {
		const iso = selectedIso;
		const row = getDateSchedule(schedule, iso);
		dayDraft = {
			day: weekdayLabel,
			enabled: row.enabled,
			slots: row.slots.map((s) => ({ ...s }))
		};
	});

	$effect(() => {
		const iso = selectedIso;
		const payload = {
			enabled: dayDraft.enabled,
			slots: dayDraft.slots.map((s) => ({ ...s }))
		};
		const current = getDateSchedule(schedule, iso);
		if (JSON.stringify(current) === JSON.stringify(payload)) return;
		schedule = setDateSchedule(schedule, iso, payload);
	});

	function onCalendarSelect(date: Date) {
		selectedDate = startOfDay(date);
	}

	function applyFullToWeek() {
		const preset = defaultPreset();
		const dow = toPersianWeekdayIndex(selectedDate);
		const weekStart = addDays(selectedDate, -dow);
		for (let i = 0; i < 7; i++) {
			if (WEEKDAYS_FA[i] === 'جمعه') continue;
			const d = addDays(weekStart, i);
			const applied = applyPreset({ day: WEEKDAYS_FA[i], enabled: true, slots: [] }, preset);
			schedule = setDateSchedule(schedule, toIsoDateString(d), {
				enabled: true,
				slots: applied.slots
			});
		}
	}

	function copyToSameWeekdayInMonth() {
		if (!dayDraft.enabled || !dayDraft.slots.length) return;
		const slots = dayDraft.slots.map((s) => ({ ...s }));
		const targetDow = selectedDate.getDay();
		const y = selectedDate.getFullYear();
		const m = selectedDate.getMonth();
		const last = new Date(y, m + 1, 0).getDate();
		for (let d = 1; d <= last; d++) {
			const date = new Date(y, m, d, 12, 0, 0, 0);
			if (date.getDay() !== targetDow) continue;
			schedule = setDateSchedule(schedule, toIsoDateString(date), {
				enabled: true,
				slots: slots.map((s) => ({ ...s }))
			});
		}
	}

	function applyFullNextDays(count: number) {
		const preset = defaultPreset();
		let d = startOfDay(new Date());
		let added = 0;
		while (added < count) {
			if (d.getDay() !== 5) {
				const applied = applyPreset({ day: '', enabled: true, slots: [] }, preset);
				schedule = setDateSchedule(schedule, toIsoDateString(d), {
					enabled: true,
					slots: applied.slots
				});
				added++;
			}
			d = addDays(d, 1);
		}
	}
</script>

<div class="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,280px)_1fr]">
	<div class="space-y-2">
		<Calendar bind:value={selectedDate} {markedDates} onSelect={onCalendarSelect} class="border-border/50 p-3" />

		<div class="flex flex-wrap items-center gap-1.5">
			<span class="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
				<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
				روز با برنامه
			</span>
			<span class="text-border">·</span>
			<Button type="button" variant="ghost" size="sm" class="h-7 rounded-md px-2 text-[10px]" onclick={applyFullToWeek}>
				تمام‌روز این هفته
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="h-7 rounded-md px-2 text-[10px]"
				onclick={() => applyFullNextDays(14)}
			>
				۱۴ روز آینده
			</Button>
		</div>
	</div>

	<div class="rounded-xl border border-border/50 bg-muted/20 p-3">
		<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
			<div>
				<p class="text-[11px] text-muted-foreground">{weekdayLabel}</p>
				<h3 class="text-sm font-semibold">{formatJalaliBirthDate(selectedIso)}</h3>
			</div>
			{#if dayDraft.enabled && dayDraft.slots.length}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					class="h-7 rounded-md px-2 text-[10px]"
					onclick={copyToSameWeekdayInMonth}
				>
					کپی {weekdayLabel}های ماه
				</Button>
			{/if}
		</div>

		<ScheduleDayPanel bind:day={dayDraft} />
	</div>
</div>
