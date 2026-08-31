<script lang="ts">
	import type { CalendarView } from '../types';
	import Button from '$lib/components/ui/button.svelte';
	import Select from '$lib/components/ui/select.svelte';
	import { ChevronLeft, ChevronRight, Plus, Search } from '@lucide/svelte';
	import {
		formatJalaliMonthRange,
		formatMonthYearFa,
		formatJalaliMonthShort
	} from '../utils/calendar-grid';
	import { dateToJalali, formatFaDigits } from '$lib/date';

	let {
		cursor,
		view,
		onPrev,
		onNext,
		onToday,
		onViewChange,
		onNewEvent
	}: {
		cursor: Date;
		view: CalendarView;
		onPrev: () => void;
		onNext: () => void;
		onToday: () => void;
		onViewChange: (v: CalendarView) => void;
		onNewEvent?: () => void;
	} = $props();

	const todayJ = $derived(dateToJalali(new Date()));
	const cursorJ = $derived(dateToJalali(cursor));

	const viewLabels: Record<CalendarView, string> = {
		month: 'نمای ماه',
		week: 'نمای هفته',
		day: 'نمای روز'
	};
</script>

<div class="flex flex-col gap-4 border-b border-border/60 pb-4">
	<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
		<div class="flex min-w-0 items-center gap-3">
			<div
				class="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-border/70 bg-muted/30 leading-none"
				aria-hidden="true"
			>
				<span class="text-[10px] font-medium text-muted-foreground">
					{formatJalaliMonthShort(cursor)}
				</span>
				<span class="mt-0.5 text-sm font-semibold tabular-nums">
					{formatFaDigits(todayJ.jd)}
				</span>
			</div>
			<div class="min-w-0">
				<h2 class="truncate text-base font-semibold tracking-tight sm:text-lg">
					{formatMonthYearFa(cursor)}
				</h2>
				<p class="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
					{formatJalaliMonthRange(cursor)}
				</p>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
				aria-label="جستجو در تقویم"
			>
				<Search class="h-4 w-4" />
			</button>

			<Button variant="outline" size="sm" class="h-9 rounded-lg px-3" onclick={onToday}>
				امروز
			</Button>

			<div class="inline-flex items-center rounded-lg border border-border/70 bg-background">
				<button
					type="button"
					class="rounded-s-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
					onclick={onPrev}
					aria-label="ماه قبل"
				>
					<ChevronRight class="h-4 w-4" />
				</button>
				<button
					type="button"
					class="rounded-e-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
					onclick={onNext}
					aria-label="ماه بعد"
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
			</div>

			<Select
				class="h-9 w-[7.5rem] rounded-lg text-xs sm:w-32 sm:text-sm"
				value={view}
				onchange={(e: Event) =>
					onViewChange((e.currentTarget as HTMLSelectElement).value as CalendarView)}
				aria-label="نوع نمای تقویم"
			>
				<option value="month">{viewLabels.month}</option>
				<option value="week">{viewLabels.week}</option>
				<option value="day">{viewLabels.day}</option>
			</Select>

			{#if onNewEvent}
				<Button size="sm" class="h-9 rounded-lg px-3" onclick={onNewEvent}>
					<Plus class="h-4 w-4" />
					<span class="hidden sm:inline">نوبت جدید</span>
					<span class="sm:hidden">جدید</span>
				</Button>
			{/if}
		</div>
	</div>
</div>
