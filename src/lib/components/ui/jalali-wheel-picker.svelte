<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		JALALI_MONTHS,
		dateToJalali,
		formatFaDigitsFast,
		jalaliMonthLength,
		jalaliToGregorianDate
	} from '$lib/date';

	const ITEM_H = 40;
	const VISIBLE = 5;
	const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

	let {
		value = $bindable(new Date()),
		minYear = 1300,
		maxYear,
		class: className = '',
		onChange
	}: {
		value?: Date;
		minYear?: number;
		maxYear?: number;
		class?: string;
		onChange?: (date: Date) => void;
	} = $props();

	const todayJ = dateToJalali(new Date());
	const yearMax = $derived(maxYear ?? todayJ.jy + 5);
	const initial = dateToJalali(value);

	let jy = $state(initial.jy);
	let jm = $state(initial.jm);
	let jd = $state(initial.jd);

	let dayEl = $state<HTMLDivElement | null>(null);
	let monthEl = $state<HTMLDivElement | null>(null);
	let yearEl = $state<HTMLDivElement | null>(null);
	let ready = $state(false);
	let applyingScroll = false;

	const years = $derived.by(() => {
		const out: number[] = [];
		for (let y = minYear; y <= yearMax; y++) out.push(y);
		return out;
	});

	const daysInMonth = $derived(jalaliMonthLength(jy, jm));
	const days = $derived(Array.from({ length: daysInMonth }, (_, i) => i + 1));

	function clampDay(y: number, m: number, d: number) {
		return Math.min(d, jalaliMonthLength(y, m));
	}

	function applyParts(y: number, m: number, d: number, scroll = true) {
		const cy = Math.min(yearMax, Math.max(minYear, y));
		const cm = Math.min(12, Math.max(1, m));
		const cd = clampDay(cy, cm, d);
		const changed = cy !== jy || cm !== jm || cd !== jd;
		jy = cy;
		jm = cm;
		jd = cd;
		if (scroll) scrollColumns();
		if (changed) {
			const next = jalaliToGregorianDate(cy, cm, cd);
			value = next;
			onChange?.(next);
		}
	}

	function scrollColumns() {
		applyingScroll = true;
		const yi = years.indexOf(jy);
		dayEl?.scrollTo({ top: (jd - 1) * ITEM_H });
		monthEl?.scrollTo({ top: (jm - 1) * ITEM_H });
		yearEl?.scrollTo({ top: Math.max(0, yi) * ITEM_H });
		requestAnimationFrame(() => {
			applyingScroll = false;
		});
	}

	function indexFromScroll(el: HTMLDivElement) {
		return Math.round(el.scrollTop / ITEM_H);
	}

	/** Sync inward when parent changes `value`. */
	$effect(() => {
		const j = dateToJalali(value);
		if (!ready) {
			jy = Math.min(yearMax, Math.max(minYear, j.jy));
			jm = j.jm;
			jd = clampDay(jy, jm, j.jd);
			return;
		}
		if (j.jy === jy && j.jm === jm && j.jd === jd) return;
		applyParts(j.jy, j.jm, j.jd, true);
	});

	$effect(() => {
		if (!dayEl || !monthEl || !yearEl) return;
		ready = true;
		scrollColumns();
	});

	let dayTimer: ReturnType<typeof setTimeout> | undefined;
	let monthTimer: ReturnType<typeof setTimeout> | undefined;
	let yearTimer: ReturnType<typeof setTimeout> | undefined;

	function onDayScroll() {
		if (applyingScroll || !dayEl) return;
		clearTimeout(dayTimer);
		dayTimer = setTimeout(() => {
			if (!dayEl) return;
			const next = Math.min(daysInMonth, Math.max(1, indexFromScroll(dayEl) + 1));
			if (next !== jd) applyParts(jy, jm, next, false);
		}, 60);
	}

	function onMonthScroll() {
		if (applyingScroll || !monthEl) return;
		clearTimeout(monthTimer);
		monthTimer = setTimeout(() => {
			if (!monthEl) return;
			const next = Math.min(12, Math.max(1, indexFromScroll(monthEl) + 1));
			if (next !== jm) applyParts(jy, next, jd, true);
		}, 60);
	}

	function onYearScroll() {
		if (applyingScroll || !yearEl) return;
		clearTimeout(yearTimer);
		yearTimer = setTimeout(() => {
			if (!yearEl) return;
			const i = Math.min(years.length - 1, Math.max(0, indexFromScroll(yearEl)));
			const next = years[i] ?? jy;
			if (next !== jy) applyParts(next, jm, jd, true);
		}, 60);
	}

	const colClass =
		'h-full flex-1 touch-pan-y snap-y snap-mandatory overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
	const itemClass =
		'flex h-10 shrink-0 snap-center items-center justify-center text-base tabular-nums text-muted-foreground transition-colors duration-150';
</script>

<div
	class={cn('relative select-none', className)}
	style="height: {VISIBLE * ITEM_H}px"
	role="group"
	aria-label="انتخاب تاریخ"
	dir="rtl"
>
	<div
		class="pointer-events-none absolute inset-x-0 z-10 border-y border-border bg-muted/40"
		style="top: {PAD}px; height: {ITEM_H}px"
		aria-hidden="true"
	></div>
	<div
		class="pointer-events-none absolute inset-x-0 top-0 z-[5] h-14 bg-gradient-to-b from-background via-background/80 to-transparent"
		aria-hidden="true"
	></div>
	<div
		class="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-14 bg-gradient-to-t from-background via-background/80 to-transparent"
		aria-hidden="true"
	></div>

	<div class="relative z-0 flex h-full gap-0.5">
		<div
			bind:this={dayEl}
			class={colClass}
			style="padding-block: {PAD}px"
			onscroll={onDayScroll}
		>
			{#each days as day (day)}
				<div class={cn(itemClass, day === jd && 'scale-105 font-bold text-foreground')}>
					{formatFaDigitsFast(day)}
				</div>
			{/each}
		</div>

		<div
			bind:this={monthEl}
			class={colClass}
			style="padding-block: {PAD}px"
			onscroll={onMonthScroll}
		>
			{#each JALALI_MONTHS as monthName, index (monthName)}
				{@const month = index + 1}
				<div class={cn(itemClass, month === jm && 'scale-105 font-bold text-foreground')}>
					{monthName}
				</div>
			{/each}
		</div>

		<div
			bind:this={yearEl}
			class={colClass}
			style="padding-block: {PAD}px"
			onscroll={onYearScroll}
		>
			{#each years as year (year)}
				<div class={cn(itemClass, year === jy && 'scale-105 font-bold text-foreground')}>
					{formatFaDigitsFast(year)}
				</div>
			{/each}
		</div>
	</div>
</div>
