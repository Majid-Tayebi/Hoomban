<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		JALALI_MONTHS,
		addJalaliMonths,
		dateToJalali,
		formatFaDigitsFast,
		jalaliMonthLength,
		jalaliToGregorianDate,
		parseIsoDate,
		toIsoDateString,
		toPersianWeekdayIndex,
		type JalaliDate
	} from '$lib/date';
	import JalaliWheelPicker from '$lib/components/ui/jalali-wheel-picker.svelte';

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
	const yearMax = $derived(maxYear ?? todayJ.jy + 5);

	const initialJ = dateToJalali(value);
	let viewJy = $state(initialJ.jy);
	let viewJm = $state(initialJ.jm);
	let panelMode = $state<PanelMode>('days');
	let yearPageStart = $state(
		Math.max(1300, Math.min(Math.floor(initialJ.jy / 12) * 12, todayJ.jy - 11))
	);
	let isMobile = $state(false);

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

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(max-width: 767px)');
		const sync = () => {
			isMobile = mq.matches;
		};
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

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

	function onWheelChange(date: Date) {
		value = date;
		const j = dateToJalali(date);
		viewJy = j.jy;
		viewJm = j.jm;
		onSelect?.(date);
	}

	const gridPickClass =
		'rounded-lg px-2 py-2.5 text-sm transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
</script>

<div class={cn('rounded-lg border p-4', className)}>
	{#if isMobile}
		{@const markedList = [...markedDates].sort().slice(0, 16)}
		<div class="space-y-3">
			<p class="text-center text-xs text-muted-foreground">روز · ماه · سال را بچرخانید</p>
			<JalaliWheelPicker
				bind:value
				{minYear}
				maxYear={yearMax}
				class="mx-auto max-w-sm"
				onChange={onWheelChange}
			/>
			{#if markedList.length}
				<div class="space-y-1.5">
					<p class="text-[11px] font-medium text-muted-foreground">روزهای دارای برنامه</p>
					<div
						class="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					>
						{#each markedList as iso (iso)}
							{@const d = parseIsoDate(iso)}
							{#if d}
								{@const j = dateToJalali(d)}
								{@const active = toIsoDateString(value) === iso}
								<button
									type="button"
									class={cn(
										'shrink-0 rounded-full border px-2.5 py-1 text-[11px] tabular-nums transition-all duration-200',
										active
											? 'border-primary bg-primary text-primary-foreground'
											: 'border-border/70 bg-muted/40 text-foreground hover:border-primary/40'
									)}
									onclick={() => {
										value = d;
										onWheelChange(d);
									}}
								>
									{formatFaDigitsFast(j.jd)} {JALALI_MONTHS[j.jm - 1]}
								</button>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else}
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
				{#each ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as wd (wd)}
					<div class="pb-1 text-[11px] font-medium text-muted-foreground/80">{wd}</div>
				{/each}

				{#each emptyDays as _, i (i)}
					<div aria-hidden="true"></div>
				{/each}

				{#each days as day (day)}
					{@const picked = isSelectedDay(day, selectedJ)}
					{@const cellDate = jalaliToGregorianDate(viewJy, viewJm, day)}
					{@const hasSchedule = markedDates.has(toIsoDateString(cellDate))}
					{@const isToday =
						todayJ.jy === viewJy && todayJ.jm === viewJm && todayJ.jd === day}
					<button
						type="button"
						onclick={() => selectDay(day)}
						aria-current={isToday ? 'date' : undefined}
						aria-pressed={picked}
						class={cn(
							'relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums transition-all duration-200 ease-in-out',
							'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
							picked && 'bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary',
							!picked && hasSchedule && 'bg-primary/10 font-medium text-primary hover:bg-primary/15',
							!picked && isToday && !hasSchedule && 'text-primary ring-1 ring-primary/45',
							!picked && isToday && hasSchedule && 'ring-1 ring-primary/30'
						)}
					>
						{formatFaDigitsFast(day)}
						{#if hasSchedule && !picked}
							<span
								class="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
								aria-hidden="true"
							></span>
						{:else if hasSchedule && picked}
							<span
								class="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary-foreground/80"
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
	{/if}
</div>
