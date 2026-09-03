<script lang="ts">
	import { page } from '$app/stores';
	import { getUser, hydrateAuthFromSession } from '$lib/auth.svelte';
	import { pb } from '$lib/pocketbase';
	import { canAccessPatientRecord } from '$lib/rbac';
	import { goto } from '$app/navigation';
	import { loadPatientsPageData } from '$lib/patients';
	import type { PatientListItem } from '$lib/patients/types';
	import PatientsTable from '$lib/patients/components/patients-table.svelte';
	import { globalSearch } from '$lib/search.svelte';

	const PAGE_SIZE = 12;

	let user = $derived(getUser() ?? $page.data.user);
	let patients = $state<PatientListItem[]>([]);
	let totalItems = $state(0);
	let listPage = $state(1);
	let loading = $state(true);
	let error = $state('');
	let lastQuery = $state('');

	async function load(pageNum: number, query: string) {
		if (!user) return;
		loading = true;
		error = '';
		try {
			if (!pb.authStore.isValid) await hydrateAuthFromSession();
			if (!pb.authStore.isValid) {
				error = 'احراز هویت منقضی شده — دوباره وارد شوید';
				patients = [];
				totalItems = 0;
				return;
			}

			const data = await loadPatientsPageData(user, {
				page: pageNum,
				pageSize: PAGE_SIZE,
				query
			});
			patients = data.patients;
			totalItems = data.totalItems;
			listPage = data.page;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'خطا در بارگذاری مراجعان';
			patients = [];
			totalItems = 0;
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
		if (!user || !canAccessPatientRecord(user.role)) return;

		const q = globalSearch.query.trim();
		let pageNum = listPage;

		if (q !== lastQuery) {
			lastQuery = q;
			if (pageNum !== 1) {
				listPage = 1;
				return;
			}
		}

		void load(pageNum, q);
	});
</script>

{#if error}
	<p class="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
{/if}

<PatientsTable
	{patients}
	{loading}
	bind:page={listPage}
	pageSize={PAGE_SIZE}
	{totalItems}
	serverPaged={true}
/>
