<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getUser } from '$lib/auth.svelte';
	import { loadAppointmentsPageData } from '$lib/appointments';
	import type { AppointmentsPageData } from '$lib/appointments/types';
	import AppointmentStatsGrid from '$lib/appointments/components/appointment-stats-grid.svelte';
	import AppointmentsListTable from '$lib/appointments/components/appointments-list-table.svelte';
	import PatientCancellationBanner from '$lib/appointments/components/patient-cancellation-banner.svelte';
	import PatientSupportRequestDialog from '$lib/appointments/components/patient-support-request-dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';

	let user = $derived(getUser());
	let focusAppointmentId = $derived($page.url.searchParams.get('appointment'));
	let supportOpen = $state(false);
	let supportAppointmentId = $state<string | null>(null);
	let data = $state<AppointmentsPageData | null>(null);
	let loading = $state(true);
	let bookingOpen = $state(false);
	let bookingSession = $state(0);
	let BookingModalCmp = $state<typeof import('$lib/appointments/components/booking-modal.svelte').default | null>(
		null
	);

	const canBook = $derived(user?.role === 'secretary' || user?.role === 'admin');

	async function load() {
		if (!user) return;
		loading = true;
		try {
			data = await loadAppointmentsPageData(user);
		} finally {
			loading = false;
		}
	}

	async function openBooking() {
		if (!BookingModalCmp) {
			const mod = await import('$lib/appointments/components/booking-modal.svelte');
			BookingModalCmp = mod.default;
		}
		bookingSession += 1;
		bookingOpen = true;
	}

	function openSupportRequest(appointmentId?: string) {
		supportAppointmentId = appointmentId ?? focusAppointmentId;
		supportOpen = true;
	}

	$effect(() => {
		if (user) load();
	});
</script>

{#if data && user}
	<div class="space-y-4 sm:space-y-5">
		{#if user.role === 'doctor'}
			<div class="min-w-0">
				<h1 class="text-lg font-bold tracking-tight sm:text-xl">داشبورد</h1>
				<p class="mt-0.5 text-sm text-muted-foreground">نوبت‌های شما — برای باز کردن پرونده روی نام مراجع کلیک کنید</p>
			</div>
		{:else if user.role === 'patient'}
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="min-w-0">
					<h1 class="text-lg font-bold tracking-tight sm:text-xl">نوبت‌های من</h1>
					<p class="mt-0.5 text-sm text-muted-foreground">مشاهده و ویرایش زمان یا متخصص نوبت‌های رزرو‌شده</p>
				</div>
				<Button class="rounded-xl" onclick={() => goto('/appointments/book')}>رزرو نوبت جدید</Button>
			</div>
		{/if}
		<AppointmentStatsGrid stats={data.stats} />
		{#if user.role === 'patient'}
			<PatientCancellationBanner
				appointments={data.appointments}
				{focusAppointmentId}
				onRequestSupport={openSupportRequest}
			/>
		{/if}
		<AppointmentsListTable
			appointments={data.appointments}
			{loading}
			{focusAppointmentId}
			onChanged={load}
			onNewAppointment={canBook ? openBooking : undefined}
		/>
	</div>
	{#if user.role === 'patient'}
		<PatientSupportRequestDialog
			bind:open={supportOpen}
			appointmentId={supportAppointmentId}
		/>
	{/if}
	{#if canBook && BookingModalCmp}
		<BookingModalCmp bind:open={bookingOpen} {user} sessionKey={bookingSession} onBooked={load} />
	{/if}
{:else if loading}
	<div class="flex min-h-[40vh] items-center justify-center">
		<p class="text-sm text-muted-foreground">در حال بارگذاری نوبت‌ها...</p>
	</div>
{/if}
