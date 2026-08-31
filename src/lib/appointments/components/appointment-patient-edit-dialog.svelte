<script lang="ts">
	import type { AppointmentListItem } from '../types';
	import type { BookingDoctor, BookingSlot } from '../booking-types';
	import {
		loadBookingDoctors,
		slotToIsoDateTime
	} from '../services/booking';
	import { updatePatientAppointment } from '../services/appointment-actions';
	import SpecialistPickList from './specialist-pick-list.svelte';
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

	let doctors = $state<BookingDoctor[]>([]);
	let loadingDoctors = $state(false);
	let selectedDoctor = $state<BookingDoctor | null>(null);
	let selectedDate = $state(new Date());
	let selectedSlot = $state<BookingSlot | null>(null);
	let saving = $state(false);
	let error = $state('');
	let step = $state<'doctor' | 'datetime'>('doctor');

	$effect(() => {
		if (!open || !appointment) return;
		step = 'doctor';
		selectedDate = new Date(appointment.dateTime);
		selectedSlot = null;
		error = '';
		loadingDoctors = true;
		void loadBookingDoctors()
			.then((list) => {
				doctors = list;
				selectedDoctor = list.find((d) => d.id === appointment?.doctorId) ?? null;
			})
			.catch(() => {
				doctors = [];
				selectedDoctor = null;
			})
			.finally(() => {
				loadingDoctors = false;
			});
	});

	function pickDoctor(doctor: BookingDoctor) {
		selectedDoctor = doctor;
		selectedSlot = null;
		step = 'datetime';
	}

	async function submit() {
		if (!appointment || !selectedDoctor || !selectedSlot) {
			error = 'متخصص و زمان جدید را انتخاب کنید.';
			return;
		}
		saving = true;
		error = '';
		try {
			await updatePatientAppointment(appointment.id, {
				doctorId: selectedDoctor.id,
				dateTime: slotToIsoDateTime(selectedSlot)
			});
			open = false;
			appointment = null;
			await onSaved?.();
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'ویرایش نوبت ناموفق بود';
		} finally {
			saving = false;
		}
	}
</script>

<Dialog bind:open class="max-w-2xl">
	<div class="space-y-4 text-right">
		<div>
			<h3 class="text-base font-semibold">ویرایش نوبت</h3>
			{#if appointment}
				<p class="mt-2 text-sm text-muted-foreground">
					زمان فعلی:
					<span class="tabular-nums">{formatFaDate(appointment.dateTime)} · {formatFaTime(appointment.dateTime)}</span>
					— {appointment.doctorName}
				</p>
			{/if}
		</div>

		{#if step === 'doctor'}
			<SpecialistPickList
				{doctors}
				selectedId={selectedDoctor?.id ?? null}
				loading={loadingDoctors}
				onSelect={pickDoctor}
			/>
		{:else if selectedDoctor}
			<div class="space-y-3">
				<div class="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2">
					<div class="min-w-0">
						<p class="text-xs text-muted-foreground">متخصص انتخاب‌شده</p>
						<p class="truncate text-sm font-medium">{selectedDoctor.name}</p>
					</div>
					<Button variant="outline" size="sm" class="rounded-lg" onclick={() => (step = 'doctor')}>
						تغییر متخصص
					</Button>
				</div>
				<BookingDatetimePanel
					doctor={selectedDoctor}
					bind:selectedDate
					bind:selectedSlot
					excludeAppointmentId={appointment?.id ?? null}
				/>
			</div>
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
			{#if step === 'datetime'}
				<Button size="sm" class="rounded-xl" disabled={saving || !selectedSlot} onclick={submit}>
					{#if saving}
						<LoaderCircle class="ml-1.5 h-4 w-4 animate-spin" />
					{/if}
					ذخیره تغییرات
				</Button>
			{/if}
		</div>
	</div>
</Dialog>
