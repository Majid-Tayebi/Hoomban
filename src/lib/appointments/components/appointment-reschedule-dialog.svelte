<script lang="ts">
	import type { AppointmentListItem } from '../types';
	import { rescheduleAppointment } from '../services/appointment-actions';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { formatFaDate, formatFaTime, toIsoDateString } from '$lib/date';
	import { LoaderCircle } from '@lucide/svelte';

	type JalaliDatePickerComponent = typeof import('$lib/components/ui/jalali-date-picker.svelte').default;

	let {
		open = $bindable(false),
		appointment = $bindable(null as AppointmentListItem | null),
		onSaved
	}: {
		open?: boolean;
		appointment?: AppointmentListItem | null;
		onSaved?: () => void | Promise<void>;
	} = $props();

	let isoDate = $state('');
	let timeValue = $state('');
	let saving = $state(false);
	let error = $state('');
	let JalaliDatePickerCmp = $state<JalaliDatePickerComponent | null>(null);

	$effect(() => {
		if (!open || !appointment) return;
		isoDate = toIsoDateString(appointment.dateTime);
		timeValue = appointment.dateTime.toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		error = '';
	});

	$effect(() => {
		if (!open) return;
		if (JalaliDatePickerCmp) return;
		void import('$lib/components/ui/jalali-date-picker.svelte').then((mod) => {
			JalaliDatePickerCmp = mod.default;
		});
	});

	function combineDateTime(): string | null {
		if (!isoDate || !timeValue) return null;
		const match = /^(\d{2}):(\d{2})$/.exec(timeValue.trim());
		if (!match) return null;
		const [y, m, d] = isoDate.split('-').map(Number);
		const hours = Number(match[1]);
		const minutes = Number(match[2]);
		if (!y || !m || !d) return null;
		const dt = new Date(y, m - 1, d, hours, minutes, 0, 0);
		if (Number.isNaN(dt.getTime())) return null;
		return dt.toISOString();
	}

	async function submit() {
		if (!appointment) return;
		const dateTime = combineDateTime();
		if (!dateTime) {
			error = 'تاریخ و ساعت را کامل وارد کنید.';
			return;
		}
		saving = true;
		error = '';
		try {
			await rescheduleAppointment(appointment.id, dateTime);
			open = false;
			appointment = null;
			await onSaved?.();
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'تغییر زمان ناموفق بود';
		} finally {
			saving = false;
		}
	}
</script>

<Dialog bind:open class="max-w-md">
	<div class="space-y-4 text-right">
		<div>
			<h3 class="text-base font-semibold">تغییر زمان نوبت</h3>
			{#if appointment}
				<p class="mt-2 text-sm text-muted-foreground">
					<strong class="text-foreground">{appointment.patientName}</strong>
					· {appointment.doctorName}
				</p>
				<p class="mt-1 text-xs tabular-nums text-muted-foreground">
					زمان فعلی: {formatFaDate(appointment.dateTime)} · {formatFaTime(appointment.dateTime)}
				</p>
			{/if}
		</div>

		<div class="space-y-3">
			<div class="space-y-1.5">
				<Label for="reschedule-date">تاریخ جدید</Label>
				{#if JalaliDatePickerCmp}
					<JalaliDatePickerCmp
						id="reschedule-date"
						bind:value={isoDate}
						placeholder="انتخاب تاریخ"
						class="w-full"
					/>
				{:else}
					<p class="text-xs text-muted-foreground">در حال بارگذاری تقویم...</p>
				{/if}
			</div>
			<div class="space-y-1.5">
				<Label for="reschedule-time">ساعت جدید</Label>
				<Input id="reschedule-time" type="time" bind:value={timeValue} dir="ltr" class="rounded-xl" />
			</div>
		</div>

		{#if error}
			<p class="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
		{/if}

		<div class="flex flex-wrap justify-end gap-2">
			<Button
				variant="ghost"
				size="sm"
				class="rounded-xl"
				disabled={saving}
				onclick={() => {
					open = false;
					appointment = null;
				}}
			>
				انصراف
			</Button>
			<Button size="sm" class="rounded-xl" disabled={saving} onclick={submit}>
				{#if saving}
					<LoaderCircle class="ml-1.5 h-4 w-4 animate-spin" />
				{/if}
				ذخیره زمان جدید
			</Button>
		</div>
	</div>
</Dialog>
