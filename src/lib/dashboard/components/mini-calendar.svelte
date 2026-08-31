<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import { toPersianWeekdayIndex } from '$lib/date';

	let currentMonth = $state(new Date());
	let selectedDay = $state(new Date().getDate());

	const weekdayLabels = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

	let monthLabel = $derived(
		currentMonth.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })
	);
	let daysInMonth = $derived(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate());
	let firstWeekday = $derived(
		toPersianWeekdayIndex(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1))
	);
	let days = $derived(Array.from({ length: daysInMonth }, (_, i) => i + 1));
	let emptyDays = $derived(Array.from({ length: firstWeekday }, () => null));
	let today = $derived(new Date());

	function prevMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
	}

	function isToday(day: number) {
		return (
			day === today.getDate() &&
			currentMonth.getMonth() === today.getMonth() &&
			currentMonth.getFullYear() === today.getFullYear()
		);
	}
</script>

<Card class="rounded-2xl border-border/50 shadow-sm">
	<CardHeader class="flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4">
		<CardTitle class="text-sm font-semibold">تقویم</CardTitle>
		<div class="flex items-center gap-1">
			<button type="button" class="rounded-lg p-1.5 hover:bg-muted" onclick={prevMonth} aria-label="ماه قبل">
				<ChevronRight class="h-4 w-4" />
			</button>
			<span class="min-w-[8rem] text-center text-xs font-medium">{monthLabel}</span>
			<button type="button" class="rounded-lg p-1.5 hover:bg-muted" onclick={nextMonth} aria-label="ماه بعد">
				<ChevronLeft class="h-4 w-4" />
			</button>
		</div>
	</CardHeader>
	<CardContent class="px-3 pb-4">
		<div class="grid grid-cols-7 gap-0.5 text-center text-[11px]">
			{#each weekdayLabels as label}
				<div class="py-1 font-medium text-muted-foreground">{label}</div>
			{/each}
			{#each emptyDays as _}
				<div></div>
			{/each}
			{#each days as day}
				<button
					type="button"
					class={cn(
						'flex h-8 w-full items-center justify-center rounded-lg text-xs transition-colors hover:bg-muted',
						selectedDay === day && 'bg-primary text-primary-foreground hover:bg-primary',
						isToday(day) && selectedDay !== day && 'bg-primary/10 font-semibold text-primary'
					)}
					onclick={() => (selectedDay = day)}
				>
					{day.toLocaleString('fa-IR')}
				</button>
			{/each}
		</div>
	</CardContent>
</Card>
