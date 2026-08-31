<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { cn } from '$lib/utils';
	import { Copy, Plus, Trash2 } from '@lucide/svelte';
	import {
		SCHEDULE_PRESETS,
		TIME_OPTIONS,
		applyPreset,
		addSlot,
		removeSlot,
		defaultPreset,
		formatTimeFa,
		type WorkingDaySchedule
	} from '$lib/schedule/working-schedule';

	let {
		days = $bindable([] as WorkingDaySchedule[])
	}: {
		days?: WorkingDaySchedule[];
	} = $props();

	function toggleDay(index: number, checked: boolean) {
		const day = days[index];
		if (checked) {
			const next =
				day.slots.length > 0 ? { ...day, enabled: true } : applyPreset(day, defaultPreset());
			days = days.map((d, i) => (i === index ? next : d));
		} else {
			days = days.map((d, i) => (i === index ? { ...d, enabled: false } : d));
		}
	}

	function setPreset(index: number, presetId: string) {
		const preset = SCHEDULE_PRESETS.find((p) => p.id === presetId);
		if (!preset) return;
		days = days.map((d, i) => (i === index ? applyPreset(d, preset) : d));
	}

	function updateSlot(index: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) {
		days = days.map((d, i) => {
			if (i !== index) return d;
			const slots = d.slots.map((s, si) => (si === slotIndex ? { ...s, [field]: value } : s));
			return { ...d, slots, enabled: true };
		});
	}

	function onAddSlot(index: number) {
		days = days.map((d, i) => (i === index ? addSlot(d) : d));
	}

	function onRemoveSlot(index: number, slotIndex: number) {
		days = days.map((d, i) => {
			if (i !== index) return d;
			const next = removeSlot(d, slotIndex);
			return next.slots.length ? next : { ...next, enabled: false };
		});
	}

	function applyFullToWeekdays() {
		const preset = defaultPreset();
		days = days.map((d) => (d.day === 'جمعه' ? d : applyPreset(d, preset)));
	}

	function copyDayToOthers(sourceIndex: number) {
		const source = days[sourceIndex];
		if (!source.enabled || !source.slots.length) return;
		const copied = source.slots.map((s) => ({ ...s }));
		days = days.map((d, i) =>
			i === sourceIndex || d.day === 'جمعه'
				? d
				: { ...d, enabled: true, slots: copied.map((s) => ({ ...s })) }
		);
	}

	const selectClass =
		'h-9 w-full rounded-lg border border-input bg-background px-2 text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring';
</script>

<div class="mb-3 flex flex-wrap gap-2">
	<Button type="button" variant="outline" size="sm" class="rounded-xl text-xs" onclick={applyFullToWeekdays}>
		<Copy class="ml-1 h-3.5 w-3.5" />
		تمام‌روز برای شنبه–پنج‌شنبه
	</Button>
</div>

<div class="space-y-2">
	{#each days as day, index (day.day)}
		<div
			class={cn(
				'rounded-xl border border-border/60 p-3 transition-all duration-200',
				day.enabled ? 'border-primary/20 bg-primary/5' : 'bg-card'
			)}
		>
			<div class="flex items-center justify-between gap-2">
				<label class="flex cursor-pointer items-center gap-2">
					<Checkbox
						checked={day.enabled}
						onchange={(e: Event & { currentTarget: HTMLInputElement }) =>
							toggleDay(index, e.currentTarget.checked)}
					/>
					<span class="text-sm font-medium">{day.day}</span>
				</label>
				<div class="flex items-center gap-1">
					{#if day.enabled && day.slots.length}
						<button
							type="button"
							class="rounded-lg px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							title="کپی این برنامه به بقیه روزها"
							onclick={() => copyDayToOthers(index)}
						>
							کپی به بقیه
						</button>
					{/if}
					{#if day.enabled}
						<span class="text-[10px] text-primary">فعال</span>
					{/if}
				</div>
			</div>

			{#if day.enabled}
				<div class="mt-3 flex flex-wrap gap-1.5">
					{#each SCHEDULE_PRESETS as preset (preset.id)}
						<button
							type="button"
							class="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-primary/40 hover:bg-primary/10"
							onclick={() => setPreset(index, preset.id)}
						>
							{preset.label}
						</button>
					{/each}
				</div>

				<div class="mt-3 space-y-2">
					{#each day.slots as slot, slotIndex (slotIndex)}
						<div class="rounded-lg border border-border/50 bg-background/80 p-2.5">
							<div class="mb-2 flex items-center justify-between">
								<span class="text-[11px] font-medium text-muted-foreground">
									بازه {slotIndex + 1}
									{#if day.slots.length > 1 && slotIndex < day.slots.length - 1}
										<span class="text-[10px]">· بعد از استراحت</span>
									{/if}
								</span>
								{#if day.slots.length > 1}
									<button
										type="button"
										class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
										aria-label="حذف بازه"
										onclick={() => onRemoveSlot(index, slotIndex)}
									>
										<Trash2 class="h-3.5 w-3.5" />
									</button>
								{/if}
							</div>
							<div class="grid grid-cols-2 gap-2">
								<div>
									<label class="mb-1 block text-[10px] text-muted-foreground" for="start-{index}-{slotIndex}">
										شروع
									</label>
									<select
										id="start-{index}-{slotIndex}"
										class={selectClass}
										dir="ltr"
										value={slot.startTime}
										onchange={(e) =>
											updateSlot(index, slotIndex, 'startTime', e.currentTarget.value)}
									>
										{#each TIME_OPTIONS as t}
											<option value={t}>{formatTimeFa(t)}</option>
										{/each}
									</select>
								</div>
								<div>
									<label class="mb-1 block text-[10px] text-muted-foreground" for="end-{index}-{slotIndex}">
										پایان
									</label>
									<select
										id="end-{index}-{slotIndex}"
										class={selectClass}
										dir="ltr"
										value={slot.endTime}
										onchange={(e) => updateSlot(index, slotIndex, 'endTime', e.currentTarget.value)}
									>
										{#each TIME_OPTIONS as t}
											<option value={t}>{formatTimeFa(t)}</option>
										{/each}
									</select>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					class="mt-2 h-8 rounded-lg text-xs text-primary"
					onclick={() => onAddSlot(index)}
				>
					<Plus class="ml-1 h-3.5 w-3.5" />
					افزودن بازه (بعد از استراحت)
				</Button>
			{/if}
		</div>
	{/each}
</div>
