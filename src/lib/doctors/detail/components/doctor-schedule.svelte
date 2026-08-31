<script lang="ts">
	import type { DoctorScheduleSlot } from '../types';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { ChevronLeft } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let { schedule }: { schedule: DoctorScheduleSlot[] } = $props();

	const days = $derived.by(() => {
		const base = new Date();
		base.setHours(0, 0, 0, 0);
		const weekday = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
		return Array.from({ length: 5 }, (_, i) => {
			const d = new Date(base);
			d.setDate(base.getDate() + i - 1);
			return {
				key: d.toISOString().slice(0, 10),
				day: d.getDate().toLocaleString('fa-IR'),
				label: weekday[d.getDay()].slice(0, 2),
				isToday: i === 1
			};
		});
	});

	let selectedKey = $state('');
	$effect(() => {
		if (!selectedKey && days.length) selectedKey = days.find((d) => d.isToday)?.key || days[0].key;
	});

	let activeId = $state<string | null>(null);
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="pb-2 pt-4 px-4 sm:px-5">
		<CardTitle class="text-sm font-semibold sm:text-base">برنامه نوبت‌ها</CardTitle>
	</CardHeader>
	<CardContent class="space-y-3 px-4 pb-4 sm:px-5">
		<div class="flex gap-2 overflow-x-auto pb-1">
			{#each days as day}
				<button
					type="button"
					class={cn(
						'flex min-w-[3.25rem] flex-col items-center rounded-xl px-2.5 py-2 text-xs transition-colors',
						selectedKey === day.key
							? 'bg-primary text-primary-foreground'
							: 'bg-muted/50 text-muted-foreground hover:bg-muted'
					)}
					onclick={() => (selectedKey = day.key)}
				>
					<span class="text-[10px] opacity-80">{day.label}</span>
					<span class="mt-0.5 font-bold">{day.day}</span>
				</button>
			{/each}
		</div>

		{#if schedule.length === 0}
			<p class="py-6 text-center text-sm text-muted-foreground">نوبتی برای امروز نیست.</p>
		{:else}
			<ul class="space-y-2">
				{#each schedule as slot (slot.id)}
					<li>
						<button
							type="button"
							class={cn(
								'flex w-full items-center gap-3 rounded-xl border p-2.5 text-right transition-colors',
								activeId === slot.id
									? 'border-primary/40 bg-primary/5'
									: 'border-border/50 hover:bg-muted/40'
							)}
							onclick={() => (activeId = slot.id)}
						>
							<div
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
							>
								{slot.patientInitials}
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{slot.patientName}</p>
								<p class="text-[11px] text-muted-foreground">
									{slot.type}
									<span class="mx-1">·</span>
									<span dir="ltr">{slot.timeRange}</span>
								</p>
							</div>
							<ChevronLeft class="h-4 w-4 shrink-0 text-muted-foreground" />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</CardContent>
</Card>
