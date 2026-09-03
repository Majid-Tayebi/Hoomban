<script lang="ts">
	import { canNavigateToPatientFromAppointment } from '$lib/rbac';
	import type { DashboardData } from '$lib/dashboard/types';
	import StatsGrid from '$lib/dashboard/components/stats-grid.svelte';
	import AppointmentsTable from '$lib/dashboard/components/appointments-table.svelte';
	import DashboardSidebar from '$lib/dashboard/components/dashboard-sidebar.svelte';

	let { data }: { data: { dashboard: DashboardData } } = $props();

	const dashboard = $derived(data.dashboard);

	const tableVariant = $derived(
		dashboard?.role === 'patient' ? 'patient' : dashboard?.role === 'doctor' ? 'doctor' : 'clinic'
	);

	const showAside = $derived(Boolean(dashboard?.showDoctorsPanel));
</script>

{#if dashboard}
	<div
		class="grid grid-cols-1 gap-4 xl:gap-5 xl:items-stretch {showAside
			? 'xl:grid-cols-[1fr_240px] 2xl:grid-cols-[1fr_260px]'
			: ''}"
	>
		<div class="min-w-0 space-y-4 sm:space-y-5">
			<StatsGrid stats={dashboard.stats} />

			{#if dashboard.role !== 'writer'}
				<AppointmentsTable
					appointments={dashboard.appointments}
					loading={false}
					title={dashboard.appointmentsTitle}
					variant={tableVariant}
					clickablePatients={canNavigateToPatientFromAppointment(dashboard.role)}
					navigateToAppointments={dashboard.role === 'patient'}
					inProgress={dashboard.role === 'secretary'}
				/>
			{/if}

			{#if showAside}
				<div class="space-y-4 xl:hidden">
					<DashboardSidebar doctors={dashboard.doctors} showDoctors={dashboard.showDoctorsPanel} />
				</div>
			{/if}
		</div>

		{#if showAside}
			<div class="hidden min-h-0 xl:flex xl:flex-col">
				<DashboardSidebar doctors={dashboard.doctors} showDoctors={dashboard.showDoctorsPanel} />
			</div>
		{/if}
	</div>
{/if}
