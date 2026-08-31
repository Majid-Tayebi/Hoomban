<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		JALALI_MONTHS,
		addJalaliMonths,
		dateToJalali,
		formatFaDigitsFast,
		jalaliMonthLength,
		jalaliToGregorianDate,
		toIsoDateString,
		toPersianWeekdayIndex,
		type JalaliDate
	} from '$lib/date';

	type PanelMode = 'days' | 'months' | 'years';

	let {
		class: className = '',
		value = $bindable(new Date()),
		onSelect,
		minYear = 1300,
		maxYear,
		markedDates = new Set<string>()
	}: {
		class?: string;
		value?: Date;
		onSelect?: (date: Date) => void;
		minYear?: number;
		maxYear?: number;
		markedDates?: ReadonlySet<string>;
	} = $props();

	const todayJ = dateToJalali(new Date());
	const yearMax = $derived(maxYear ?? todayJ.jy);

	const initialJ = dateToJalali(value);
	let viewJy = $state(initialJ.jy);
	let viewJm = $state(initialJ.jm);
	let panelMode = $state<PanelMode>('days');
	let yearPageStart = $state(
		Math.max(minYear, Math.min(Math.floor(initialJ.jy / 12) * 12, (maxYear ?? todayJ.jy) - 11))
	);

	const selectedJ = $derived(dateToJalali(value));
	const daysInMonth = $derived(jalaliMonthLength(viewJy, viewJm));
	const firstOfMonth = $derived(jalaliToGregorianDate(viewJy, viewJm, 1));
	const leadingEmpty = $derived(toPersianWeekdayIndex(firstOfMonth));
	const days = $derived(Array.from({ length: daysInMonth }, (_, i) => i + 1));
	const emptyDays = $derived(Array.from({ length: leadingEmpty }, () => 0));

	const yearOptions = $derived.by(() => {
		const out: number[] = [];
		for (let i = 0; i < 12; i++) {
			const y = yearPageStart + i;
			if (y >= minYear && y <= yearMax) out.push(y);
		}
		return out;
	});

	const pickerBtnClass =
		'rounded-lg px-2 py-1 text-sm font-semibold tabular-nums transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

	function clampDay(jy: number, jm: number, jd: number) {
		return Math.min(jd, jalaliMonthLength(jy, jm));
	}

	function applyJalali(jy: number, jm: number, jd: number) {
		const next = jalaliToGregorianDate(jy, jm, clampDay(jy, jm, jd));
		value = next;
		onSelect?.(next);
	}

	function selectDay(day: number) {
		applyJalali(viewJy, viewJm, day);
		panelMode = 'days';
	}

	function selectMonth(month: number) {
		viewJm = month;
		applyJalali(viewJy, month, selectedJ.jd);
		panelMode = 'days';
	}

	function selectYear(year: number) {
		viewJy = year;
		applyJalali(year, viewJm, selectedJ.jd);
		panelMode = 'days';
	}

	function prevMonth() {
		const n = addJalaliMonths(viewJy, viewJm, -1);
		viewJy = n.jy;
		viewJm = n.jm;
	}

	function nextMonth() {
		const n = addJalaliMonths(viewJy, viewJm, 1);
		viewJy = n.jy;
		viewJm = n.jm;
	}

	function prevYearPage() {
		yearPageStart = Math.max(minYear, yearPageStart - 12);
	}

	function nextYearPage() {
		yearPageStart = Math.min(Math.max(minYear, yearMax - 11), yearPageStart + 12);
	}

	function openMonths() {
		panelMode = 'months';
	}

	function openYears() {
		yearPageStart = Math.max(minYear, Math.min(Math.floor(viewJy / 12) * 12, yearMax - 11));
		panelMode = 'years';
	}

	function isSelectedDay(day: number, sel: JalaliDate) {
		return sel.jy === viewJy && sel.jm === viewJm && sel.jd === day;
	}

	const gridPickClass =
		'rounded-lg px-2 py-2.5 text-sm transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
</script>

<div class={cn('rounded-lg border p-4', className)}>
	<div
		class={cn(
			'mb-4 flex items-center gap-2',
			panelMode === 'months' ? 'justify-center' : 'justify-between'
		)}
		dir="ltr"
	>
		{#if panelMode === 'days'}
			<button
				type="button"
				class="rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
				aria-label="ماه بعد"
				onclick={nextMonth}
			>
				←
			</button>
			<div class="flex items-center gap-1" dir="rtl">
				<button type="button" class={pickerBtnClass} onclick={openMonths}>
					{JALALI_MONTHS[viewJm - 1]}
				</button>
				<button type="button" class={pickerBtnClass} onclick={openYears}>
					{formatFaDigitsFast(viewJy)}
				</button>
			</div>
			<button
				type="button"
				class="rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
				aria-label="ماه قبل"
				onclick={prevMonth}
			>
				→
			</button>
		{:else if panelMode === 'months'}
			<span class="text-sm font-semibold" dir="rtl">انتخاب ماه — {formatFaDigitsFast(viewJy)}</span>
		{:else}
			<button
				type="button"
				class="rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
				aria-label="سال‌های بعدی"
				onclick={nextYearPage}
				disabled={yearPageStart + 12 > yearMax}
			>
				←
			</button>
			<span class="text-sm font-semibold" dir="rtl">انتخاب سال</span>
			<button
				type="button"
				class="rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
				aria-label="سال‌های قبل‌تر"
				onclick={prevYearPage}
				disabled={yearPageStart <= minYear}
			>
				→
			</button>
		{/if}
	</div>

	{#if panelMode === 'days'}
		<div class="grid grid-cols-7 gap-1 text-center text-sm">
			<div class="font-semibold text-muted-foreground">ش</div>
			<div class="font-semibold text-muted-foreground">ی</div>
			<div class="font-semibold text-muted-foreground">د</div>
			<div class="font-semibold text-muted-foreground">س</div>
			<div class="font-semibold text-muted-foreground">چ</div>
			<div class="font-semibold text-muted-foreground">پ</div>
			<div class="font-semibold text-muted-foreground">ج</div>

			{#each emptyDays as _, i (i)}
				<div aria-hidden="true"></div>
			{/each}

			{#each days as day (day)}
				{@const picked = isSelectedDay(day, selectedJ)}
				{@const cellDate = jalaliToGregorianDate(viewJy, viewJm, day)}
				{@const hasSchedule = markedDates.has(toIsoDateString(cellDate))}
				<button
					type="button"
					onclick={() => selectDay(day)}
					class={cn(
						'relative rounded-lg p-2 transition-colors duration-200 hover:bg-muted',
						picked ? 'bg-primary text-primary-foreground hover:bg-primary' : ''
					)}
				>
					{formatFaDigitsFast(day)}
					{#if hasSchedule && !picked}
						<span
							class="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
							aria-hidden="true"
						></span>
					{/if}
				</button>
			{/each}
		</div>
	{:else if panelMode === 'months'}
		<div class="grid grid-cols-3 gap-1.5 text-center">
			{#each JALALI_MONTHS as monthName, index (monthName)}
				{@const picked = selectedJ.jy === viewJy && selectedJ.jm === index + 1}
				<button
					type="button"
					class={cn(gridPickClass, picked ? 'bg-primary text-primary-foreground hover:bg-primary' : '')}
					onclick={() => selectMonth(index + 1)}
				>
					{monthName}
				</button>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-3 gap-1.5 text-center">
			{#each yearOptions as year (year)}
				{@const picked = selectedJ.jy === year}
				<button
					type="button"
					class={cn(gridPickClass, picked ? 'bg-primary text-primary-foreground hover:bg-primary' : '')}
					onclick={() => selectYear(year)}
				>
					{formatFaDigitsFast(year)}
				</button>
			{/each}
		</div>
	{/if}
</div>
