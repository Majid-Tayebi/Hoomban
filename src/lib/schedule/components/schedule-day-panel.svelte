<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { Plus, Trash2 } from '@lucide/svelte';
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
		day = $bindable({ day: '', enabled: false, slots: [] } as WorkingDaySchedule),
		showDisable = true
	}: {
		day?: WorkingDaySchedule;
		showDisable?: boolean;
	} = $props();

	function setPreset(presetId: string) {
		const preset = SCHEDULE_PRESETS.find((p) => p.id === presetId);
		if (!preset) return;
		day = applyPreset(day, preset);
	}

	function updateSlot(slotIndex: number, field: 'startTime' | 'endTime', value: string) {
		day = {
			...day,
			enabled: true,
			slots: day.slots.map((s, si) => (si === slotIndex ? { ...s, [field]: value } : s))
		};
	}

	function onAddSlot() {
		day = addSlot(day);
	}

	function onRemoveSlot(slotIndex: number) {
		const next = removeSlot(day, slotIndex);
		day = next.slots.length ? next : { ...next, enabled: false };
	}

	function disableDay() {
		day = { ...day, enabled: false, slots: [] };
	}

	function activateDefault() {
		day = applyPreset({ ...day, enabled: true, slots: [] }, defaultPreset());
	}

	const selectClass =
		'h-8 w-full rounded-lg border border-input bg-background px-2 text-xs tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring';
</script>

{#if !day.enabled || !day.slots.length}
	<div class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2">
		<p class="text-xs text-muted-foreground">برای این روز ساعتی ثبت نشده</p>
		<Button type="button" class="h-8 rounded-lg px-3 text-xs" size="sm" onclick={activateDefault}>
			ثبت حضور
		</Button>
	</div>
{:else}
	<div class="flex flex-wrap gap-1">
		{#each SCHEDULE_PRESETS as preset (preset.id)}
			<button
				type="button"
				class="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-medium transition-colors hover:border-primary/40 hover:bg-primary/10"
				onclick={() => setPreset(preset.id)}
			>
				{preset.label}
			</button>
		{/each}
	</div>

	<div class="mt-2 space-y-1.5">
		{#each day.slots as slot, slotIndex (slotIndex)}
			<div class="flex flex-wrap items-end gap-2">
				<div class="min-w-[7rem] flex-1">
					<label class="mb-0.5 block text-[10px] text-muted-foreground" for="ds-{slotIndex}-s">
						شروع
					</label>
					<select
						id="ds-{slotIndex}-s"
						class={selectClass}
						dir="ltr"
						value={slot.startTime}
						onchange={(e: Event & { currentTarget: HTMLSelectElement }) =>
							updateSlot(slotIndex, 'startTime', e.currentTarget.value)}
					>
						{#each TIME_OPTIONS as t (t)}
							<option value={t}>{formatTimeFa(t)}</option>
						{/each}
					</select>
				</div>
				<div class="min-w-[7rem] flex-1">
					<label class="mb-0.5 block text-[10px] text-muted-foreground" for="ds-{slotIndex}-e">
						پایان
					</label>
					<select
						id="ds-{slotIndex}-e"
						class={selectClass}
						dir="ltr"
						value={slot.endTime}
						onchange={(e: Event & { currentTarget: HTMLSelectElement }) =>
							updateSlot(slotIndex, 'endTime', e.currentTarget.value)}
					>
						{#each TIME_OPTIONS as t (t)}
							<option value={t}>{formatTimeFa(t)}</option>
						{/each}
					</select>
				</div>
				{#if day.slots.length > 1}
					<button
						type="button"
						class="mb-0.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
						aria-label="حذف بازه"
						onclick={() => onRemoveSlot(slotIndex)}
					>
						<Trash2 class="h-3.5 w-3.5" />
					</button>
				{/if}
			</div>
		{/each}
	</div>

	<div class="mt-2 flex flex-wrap gap-1">
		<Button type="button" variant="ghost" size="sm" class="h-7 rounded-md px-2 text-[11px] text-primary" onclick={onAddSlot}>
			<Plus class="ml-1 h-3 w-3" />
			بازه
		</Button>
		{#if showDisable}
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="h-7 rounded-md px-2 text-[11px] text-destructive"
				onclick={disableDay}
			>
				حذف
			</Button>
		{/if}
	</div>
{/if}
