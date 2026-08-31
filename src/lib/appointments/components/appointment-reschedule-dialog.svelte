<script lang="ts">
	import type { AppointmentListItem } from '../types';
	import type { BookingDoctor, BookingSlot } from '../booking-types';
	import { loadBookingDoctors, slotToIsoDateTime } from '../services/booking';
	import { rescheduleAppointment } from '../services/appointment-actions';
	import BookingDatetimePanel from './booking-datetime-panel.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { formatFaDate, formatFaTime } from '$lib/date';
	import { LoaderCircle } from '@lucide/svelte';

	let {
		open = $bindable(false),
		appointment = $bindable(null as AppointmentListItem | null),
		onSaved
	}: {
		open?: boolean;
		appointment?: AppointmentListItem | null;
		onSaved?: () => void | Promise<void>;
	} = $props();

	let doctor = $state<BookingDoctor | null>(null);
	let loadingDoctor = $state(false);
	let selectedDate = $state(new Date());
	let selectedSlot = $state<BookingSlot | null>(null);
	let saving = $state(false);
	let error = $state('');

	$effect(() => {
		if (!open || !appointment) return;
		selectedDate = new Date(appointment.dateTime);
		selectedSlot = null;
		error = '';
		loadingDoctor = true;
		doctor = null;
		void loadBookingDoctors()
			.then((list) => {
				doctor = list.find((d) => d.id === appointment?.doctorId) ?? null;
			})
			.catch(() => {
				doctor = null;
			})
			.finally(() => {
				loadingDoctor = false;
			});
	});

	async function submit() {
		if (!appointment || !selectedSlot) {
			error = 'زمان جدید را از لیست ساعات آزاد انتخاب کنید.';
			return;
		}
		saving = true;
		error = '';
		try {
			await rescheduleAppointment(appointment.id, slotToIsoDateTime(selectedSlot));
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

<Dialog bind:open class="max-w-2xl">
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

		{#if loadingDoctor}
			<p class="py-8 text-center text-sm text-muted-foreground">در حال بارگذاری برنامه متخصص...</p>
		{:else if !doctor}
			<p class="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
				اطلاعات متخصص یافت نشد.
			</p>
		{:else}
			<BookingDatetimePanel
				{doctor}
				bind:selectedDate
				bind:selectedSlot
				excludeAppointmentId={appointment?.id ?? null}
			/>
		{/if}

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
			<Button size="sm" class="rounded-xl" disabled={saving || !selectedSlot} onclick={submit}>
				{#if saving}
					<LoaderCircle class="ml-1.5 h-4 w-4 animate-spin" />
				{/if}
				ذخیره زمان جدید
			</Button>
		</div>
	</div>
</Dialog>
