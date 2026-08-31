<script lang="ts">
	import type { AddDoctorForm } from '../types';
	import Label from '$lib/components/ui/label.svelte';
	import { Minus, Plus } from '@lucide/svelte';

	let { form = $bindable() }: { form: AddDoctorForm } = $props();

	const timeClass =
		'h-9 w-[5.5rem] rounded-lg border border-input bg-background px-2 text-center text-xs dir-ltr';
</script>

<section class="space-y-4">
	<h3 class="text-sm font-semibold text-primary">برنامه کاری</h3>

	<div class="space-y-2">
		<Label>روزهای کاری</Label>
		<ul class="space-y-2">
			{#each form.workingDays as day, i}
				<li class="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 px-3 py-2">
					<label class="inline-flex min-w-[5.5rem] items-center gap-2 text-sm">
						<input type="checkbox" bind:checked={form.workingDays[i].enabled} />
						{day.day}
					</label>
					{#if day.enabled}
						<input
							type="time"
							class={timeClass}
							bind:value={form.workingDays[i].startTime}
							aria-label="شروع {day.day}"
						/>
						<span class="text-xs text-muted-foreground">تا</span>
						<input
							type="time"
							class={timeClass}
							bind:value={form.workingDays[i].endTime}
							aria-label="پایان {day.day}"
						/>
					{/if}
				</li>
			{/each}
		</ul>
	</div>

	<div class="space-y-2">
		<Label>حداکثر نوبت در روز</Label>
		<div class="flex flex-wrap items-center gap-3">
			<div class="flex items-center gap-2 rounded-xl border border-border/60 px-2 py-1.5">
				<span class="text-[11px] text-muted-foreground">حداقل</span>
				<button
					type="button"
					class="rounded-lg p-1 hover:bg-muted"
					onclick={() => (form.maxAppointmentsMin = Math.max(1, form.maxAppointmentsMin - 1))}
					aria-label="کاهش حداقل"
				>
					<Minus class="h-3.5 w-3.5" />
				</button>
				<span class="min-w-[1.5rem] text-center text-sm font-semibold">
					{form.maxAppointmentsMin.toLocaleString('fa-IR')}
				</span>
				<button
					type="button"
					class="rounded-lg p-1 hover:bg-muted"
					onclick={() =>
						(form.maxAppointmentsMin = Math.min(form.maxAppointmentsMax, form.maxAppointmentsMin + 1))}
					aria-label="افزایش حداقل"
				>
					<Plus class="h-3.5 w-3.5" />
				</button>
			</div>
			<div class="flex items-center gap-2 rounded-xl border border-border/60 px-2 py-1.5">
				<span class="text-[11px] text-muted-foreground">حداکثر</span>
				<button
					type="button"
					class="rounded-lg p-1 hover:bg-muted"
					onclick={() =>
						(form.maxAppointmentsMax = Math.max(form.maxAppointmentsMin, form.maxAppointmentsMax - 1))}
					aria-label="کاهش حداکثر"
				>
					<Minus class="h-3.5 w-3.5" />
				</button>
				<span class="min-w-[1.5rem] text-center text-sm font-semibold">
					{form.maxAppointmentsMax.toLocaleString('fa-IR')}
				</span>
				<button
					type="button"
					class="rounded-lg p-1 hover:bg-muted"
					onclick={() => (form.maxAppointmentsMax = Math.min(30, form.maxAppointmentsMax + 1))}
					aria-label="افزایش حداکثر"
				>
					<Plus class="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	</div>

	<label class="flex items-center gap-2 text-sm">
		<input type="checkbox" bind:checked={form.isActive} />
		فعال و آماده پذیرش بیمار
	</label>
</section>
