<script lang="ts">
	import { getUser } from '$lib/auth.svelte';
	import { canAccessPatientRecord } from '$lib/rbac';
	import { goto } from '$app/navigation';
	import { loadPatientsPageData, filterPatients } from '$lib/patients';
	import type { PatientFilters, PatientListItem } from '$lib/patients/types';
	import PatientsTable from '$lib/patients/components/patients-table.svelte';
	import { globalSearch } from '$lib/search.svelte';

	let user = $derived(getUser());
	let patients = $state<PatientListItem[]>([]);
	let loading = $state(true);
	let error = $state('');

	let filters = $state<PatientFilters>({
		gender: 'all',
		condition: 'all',
		query: ''
	});

	const filtered = $derived(
		filterPatients(patients, { ...filters, query: globalSearch.query })
	);

	async function load() {
		if (!user) return;
		loading = true;
		error = '';
		try {
			const data = await loadPatientsPageData(user);
			patients = data.patients;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'خطا در بارگذاری مراجعان';
			patients = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (user && !canAccessPatientRecord(user.role)) {
			goto('/dashboard');
		}
	});

	$effect(() => {
		if (user && canAccessPatientRecord(user.role)) load();
	});
</script>

{#if error}
	<p class="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
{/if}

{#if loading && patients.length === 0}
	<div class="flex min-h-[40vh] items-center justify-center">
		<p class="text-sm text-muted-foreground">در حال بارگذاری مراجعان...</p>
	</div>
{:else}
	<PatientsTable patients={filtered} {loading} />
{/if}
