<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { loadDoctorDetail } from '$lib/doctors/detail';
	import type { DoctorDetailData } from '$lib/doctors/detail/types';
	import DoctorProfileCard from '$lib/doctors/detail/components/doctor-profile-card.svelte';
	import DoctorPerformance from '$lib/doctors/detail/components/doctor-performance.svelte';
	import DoctorStatCards from '$lib/doctors/detail/components/doctor-stat-cards.svelte';
	import DoctorAbout from '$lib/doctors/detail/components/doctor-about.svelte';
	import PatientOverviewChart from '$lib/doctors/detail/components/patient-overview-chart.svelte';
	import DoctorSchedule from '$lib/doctors/detail/components/doctor-schedule.svelte';
	import DoctorFeedback from '$lib/doctors/detail/components/doctor-feedback.svelte';
	import DoctorPatientsTable from '$lib/doctors/detail/components/doctor-patients-table.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { ArrowRight, CalendarDays } from '@lucide/svelte';

	let user = $derived(getUser());
	let doctorId = $derived($page.params.id);

	let data = $state<DoctorDetailData | null>(null);
	let loading = $state(true);
	let error = $state('');

	async function load() {
		if (!doctorId || !user) return;
		loading = true;
		error = '';
		try {
			data = await loadDoctorDetail(doctorId, user);
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'خطا در بارگذاری جزئیات متخصص';
			data = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (user && doctorId) load();
	});
</script>

<div class="space-y-4 sm:space-y-5">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
			<button
				type="button"
				class="inline-flex items-center gap-1 hover:text-foreground"
				onclick={() => goto('/dashboard/doctors')}
			>
				<ArrowRight class="h-4 w-4" />
				پزشکان
			</button>
			<span>/</span>
			<span class="font-medium text-foreground">جزئیات پزشک</span>
		</div>
		{#if data}
			<Button
				variant="outline"
				class="h-9 rounded-xl"
				onclick={() => goto(`/appointments/book?doctor=${data?.profile.id}`)}
			>
				<CalendarDays class="ml-1.5 h-4 w-4" />
				رزرو نوبت
			</Button>
		{/if}
	</div>

	{#if loading}
		<div class="flex min-h-[40vh] items-center justify-center">
			<p class="text-sm text-muted-foreground">در حال بارگذاری جزئیات متخصص...</p>
		</div>
	{:else if error || !data}
		<p class="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
			{error || 'متخصص یافت نشد'}
		</p>
	{:else}
		<header class="mb-1">
			<h1 class="text-xl font-bold tracking-tight sm:text-2xl">{data.profile.displayName}</h1>
			<p class="mt-1 text-sm text-muted-foreground">{data.profile.specialty}</p>
		</header>

		<!-- Desktop: 3 columns | Tablet/Mobile: stacked -->
		<div class="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr_260px] xl:gap-5">
			<!-- Left: profile + schedule -->
			<div class="space-y-4">
				<DoctorProfileCard profile={data.profile} />
				<div class="hidden xl:block">
					<DoctorSchedule schedule={data.schedule} />
				</div>
			</div>

			<!-- Center -->
			<div class="min-w-0 space-y-4">
				<!-- Mobile/tablet stats near top -->
				<div class="space-y-4 xl:hidden">
					<DoctorPerformance
						percent={data.satisfaction.percent}
						trend={data.satisfaction.trend}
						count={data.satisfaction.count}
					/>
					<DoctorStatCards stats={data.stats} />
				</div>

				<DoctorAbout profile={data.profile} />
				<PatientOverviewChart />

				<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:hidden">
					<DoctorSchedule schedule={data.schedule} />
					<DoctorFeedback feedback={data.feedback} />
				</div>

				<DoctorPatientsTable patients={data.patients} />
			</div>

			<!-- Right: performance + feedback (desktop) -->
			<div class="hidden space-y-4 xl:block">
				<DoctorPerformance
					percent={data.satisfaction.percent}
					trend={data.satisfaction.trend}
					count={data.satisfaction.count}
				/>
				<DoctorStatCards stats={data.stats} />
				<DoctorFeedback feedback={data.feedback} />
			</div>
		</div>
	{/if}
</div>
