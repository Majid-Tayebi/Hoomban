<script lang="ts">
	import { getUser } from '$lib/auth.svelte';
	import { canNavigateToPatientFromAppointment } from '$lib/rbac';
	import { loadDashboardData } from '$lib/dashboard';
	import type { DashboardData } from '$lib/dashboard/types';
	import StatsGrid from '$lib/dashboard/components/stats-grid.svelte';
	import AppointmentsTable from '$lib/dashboard/components/appointments-table.svelte';
	import DashboardSidebar from '$lib/dashboard/components/dashboard-sidebar.svelte';

	let user = $derived(getUser());
	let data = $state<DashboardData | null>(null);
	let loading = $state(true);

	const tableVariant = $derived(
		data?.role === 'patient' ? 'patient' : data?.role === 'doctor' ? 'doctor' : 'clinic'
	);

	const showAside = $derived(Boolean(data?.showDoctorsPanel));

	async function load() {
		if (!user) return;
		loading = true;
		try {
			data = await loadDashboardData(user);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (user) load();
	});
</script>

{#if data}
	<div
		class="grid grid-cols-1 gap-4 xl:gap-5 xl:items-stretch {showAside
			? 'xl:grid-cols-[1fr_240px] 2xl:grid-cols-[1fr_260px]'
			: ''}"
	>
		<div class="min-w-0 space-y-4 sm:space-y-5">
			<StatsGrid stats={data.stats} />

			{#if data.role !== 'writer'}
				<AppointmentsTable
					appointments={data.appointments}
					{loading}
					title={data.appointmentsTitle}
					variant={tableVariant}
					clickablePatients={canNavigateToPatientFromAppointment(data.role)}
					navigateToAppointments={data.role === 'patient'}
					inProgress={data.role === 'secretary'}
				/>
			{/if}

			{#if showAside}
				<div class="space-y-4 xl:hidden">
					<DashboardSidebar doctors={data.doctors} showDoctors={data.showDoctorsPanel} />
				</div>
			{/if}
		</div>

		{#if showAside}
			<div class="hidden min-h-0 xl:flex xl:flex-col">
				<DashboardSidebar doctors={data.doctors} showDoctors={data.showDoctorsPanel} />
			</div>
		{/if}
	</div>
{:else if loading}
	<div class="flex min-h-[40vh] items-center justify-center">
		<p class="text-sm text-muted-foreground">در حال آماده‌سازی داشبورد شما...</p>
	</div>
{/if}
