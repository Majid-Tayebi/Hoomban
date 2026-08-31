<script lang="ts">
	import type { BookingDoctor, BookingSlot } from '../booking-types';
	import { loadAvailableSlots } from '../services/booking';
	import Calendar from '$lib/components/ui/calendar.svelte';
	import { formatFaDate } from '$lib/date';

	let {
		doctor,
		selectedDate = $bindable(new Date()),
		selectedSlot = $bindable(null as BookingSlot | null)
	}: {
		doctor: BookingDoctor;
		selectedDate?: Date;
		selectedSlot?: BookingSlot | null;
	} = $props();

	let slots = $state<BookingSlot[]>([]);
	let loading = $state(false);

	function onPickDate(date: Date) {
		selectedDate = date;
	}

	$effect(() => {
		const d = doctor;
		const date = selectedDate;
		if (!d) return;
		loading = true;
		selectedSlot = null;
		void loadAvailableSlots(d, date)
			.then((list) => {
				slots = list;
			})
			.catch(() => {
				slots = [];
			})
			.finally(() => {
				loading = false;
			});
	});
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
		<div>
			<p class="mb-2 text-sm font-medium">انتخاب روز</p>
			<div class="overflow-x-auto">
				<Calendar
					class="w-full rounded-2xl border-border/60"
					bind:value={selectedDate}
					onSelect={onPickDate}
				/>
			</div>
			<p class="mt-2 text-xs text-muted-foreground">
				روز انتخاب‌شده: {formatFaDate(selectedDate)}
			</p>
		</div>

		<div>
			<p class="mb-2 text-sm font-medium">انتخاب ساعت</p>
			{#if loading}
				<p class="py-8 text-center text-sm text-muted-foreground">در حال بارگذاری ساعات...</p>
			{:else if slots.length === 0}
				<p
					class="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground"
				>
					برای این روز اسلات آزادی نیست. روز دیگری انتخاب کنید.
				</p>
			{:else}
				<div class="grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-2" dir="ltr">
					{#each slots as slot (slot.time)}
						{@const active = selectedSlot?.time === slot.time}
						<button
							type="button"
							class="h-11 rounded-full border text-sm font-medium tabular-nums transition-all duration-200 {active
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border/70 bg-card hover:border-primary/50 hover:bg-muted/40'}"
							onclick={() => (selectedSlot = slot)}
						>
							{slot.time}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
