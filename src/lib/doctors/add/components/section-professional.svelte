<script lang="ts">
	import type { AddDoctorForm } from '../types';
	import { DEPARTMENT_OPTIONS, SPECIALIZATION_OPTIONS } from '../types';
	import Input from '$lib/components/ui/input.svelte';
	import MoneyInput from '$lib/components/ui/money-input.svelte';
	import Label from '$lib/components/ui/label.svelte';

	let { form = $bindable() }: { form: AddDoctorForm } = $props();

	const selectClass =
		'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
</script>

<section class="space-y-4">
	<h3 class="text-sm font-semibold text-primary">اطلاعات حرفه‌ای</h3>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<div class="space-y-1.5">
			<Label for="department">بخش</Label>
			<select id="department" class={selectClass} bind:value={form.department}>
				{#each DEPARTMENT_OPTIONS as opt}
					<option value={opt}>{opt}</option>
				{/each}
			</select>
		</div>
		<div class="space-y-1.5">
			<Label for="specialization">تخصص</Label>
			<select id="specialization" class={selectClass} bind:value={form.specialization}>
				{#each SPECIALIZATION_OPTIONS as opt}
					<option value={opt}>{opt}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="space-y-1.5">
		<Label>نوع همکاری</Label>
		<div class="flex flex-wrap gap-4 text-sm">
			<label class="inline-flex items-center gap-2">
				<input type="radio" name="workType" value="full_time" bind:group={form.workType} />
				تمام‌وقت
			</label>
			<label class="inline-flex items-center gap-2">
				<input type="radio" name="workType" value="part_time" bind:group={form.workType} />
				پاره‌وقت
			</label>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<div class="space-y-1.5">
			<Label for="startDate">تاریخ شروع همکاری</Label>
			<Input id="startDate" type="date" bind:value={form.startDate} dir="ltr" />
		</div>
		<div class="space-y-1.5">
			<Label for="visitFee">تعرفه ویزیت (تومان)</Label>
			<MoneyInput id="visitFee" bind:value={form.visitFee} class="max-w-xs rounded-xl" />
		</div>
	</div>

	<div class="space-y-1.5">
		<Label for="slotDuration">مدت هر جلسه (دقیقه)</Label>
		<Input id="slotDuration" type="number" bind:value={form.slotDuration} dir="ltr" class="max-w-xs" />
	</div>
</section>
