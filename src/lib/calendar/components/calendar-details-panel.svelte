<script lang="ts">
	import type { ScheduleEvent } from '../types';
	import ScheduleEventCard from './schedule-event-card.svelte';
	import { X } from '@lucide/svelte';

	let {
		events,
		title = 'نوبت‌های روز',
		onClose,
		onSelectEvent
	}: {
		events: ScheduleEvent[];
		title?: string;
		onClose?: () => void;
		onSelectEvent?: (event: ScheduleEvent) => void;
	} = $props();
</script>

<div class="flex h-full flex-col rounded-2xl border bg-card">
	<div class="flex items-center justify-between border-b px-4 py-3">
		<h2 class="text-sm font-semibold">{title}</h2>
		{#if onClose}
			<button
				type="button"
				class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
				onclick={onClose}
				aria-label="بستن"
			>
				<X class="h-4 w-4" />
			</button>
		{/if}
	</div>

	<div class="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
		{#if events.length === 0}
			<p class="py-10 text-center text-sm text-muted-foreground">نوبتی برای این روز نیست.</p>
		{:else}
			{#each events as event (event.id)}
				<button
					type="button"
					class="w-full rounded-2xl text-right transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
					onclick={() => onSelectEvent?.(event)}
				>
					<ScheduleEventCard {event} />
				</button>
			{/each}
		{/if}
	</div>
</div>
