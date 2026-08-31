<script lang="ts">
	import { getUser } from '$lib/auth.svelte';
	import { loadAppointmentsPageData } from '$lib/appointments';
	import type { AppointmentsPageData } from '$lib/appointments/types';
	import AppointmentStatsGrid from '$lib/appointments/components/appointment-stats-grid.svelte';
	import AppointmentsListTable from '$lib/appointments/components/appointments-list-table.svelte';

	let user = $derived(getUser());
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
		{/if}
		<AppointmentStatsGrid stats={data.stats} />
		<AppointmentsListTable
			appointments={data.appointments}
			{loading}
			onChanged={load}
			onNewAppointment={canBook ? openBooking : undefined}
		/>
	</div>
	{#if canBook && BookingModalCmp}
		<BookingModalCmp bind:open={bookingOpen} {user} sessionKey={bookingSession} onBooked={load} />
	{/if}
{:else if loading}
	<div class="flex min-h-[40vh] items-center justify-center">
		<p class="text-sm text-muted-foreground">در حال بارگذاری نوبت‌ها...</p>
	</div>
{/if}
