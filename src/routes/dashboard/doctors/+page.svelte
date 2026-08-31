<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import {
		loadDoctorsPageData,
		filterDoctors,
		saveDoctor,
		toEditForm
	} from '$lib/doctors';
	import type { DoctorCardItem, DoctorEditForm, DoctorFilters } from '$lib/doctors/types';
	import DoctorsToolbar from '$lib/doctors/components/doctors-toolbar.svelte';
	import DoctorsGrid from '$lib/doctors/components/doctors-grid.svelte';
	import DoctorEditDialog from '$lib/doctors/components/doctor-edit-dialog.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';

	let user = $derived(getUser());
	let isAdmin = $derived(user?.role === 'admin');
	let doctors = $state<DoctorCardItem[]>([]);
	let specialties = $state<string[]>(['همه']);
	let loading = $state(true);
	let error = $state('');
	let message = $state('');
	let selectedId = $state<string | null>(null);

	let filters = $state<DoctorFilters>({
		query: '',
		status: 'all',
		specialty: 'همه'
	});

	let showEdit = $state(false);
	let editForm = $state<DoctorEditForm | null>(null);
	let photoFile = $state<File | null>(null);
	let editMessage = $state('');

	const filtered = $derived.by(() => {
		if (!isAdmin) {
			return doctors.filter((d) => d.isActive);
		}
		return filterDoctors(doctors, filters);
	});

	async function load() {
		if (!user) return;
		loading = true;
		error = '';
		try {
			const data = await loadDoctorsPageData(user);
			doctors = data.doctors;
			specialties = data.specialties;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'خطا در بارگذاری متخصصین';
		} finally {
			loading = false;
		}
	}

	function openEdit(d?: DoctorCardItem) {
		editForm = d
			? toEditForm(d)
			: {
					id: '',
					displayName: '',
					specialty: '',
					visitFee: 0,
					slotDuration: 45,
					bio: '',
					isActive: true
				};
		photoFile = null;
		editMessage = '';
		showEdit = true;
	}

	async function onSave() {
		if (!editForm) return;
		editMessage = '';
		try {
			const result = await saveDoctor(editForm, photoFile);
			if (!result.ok) {
				editMessage = result.message;
				return;
			}
			showEdit = false;
			message = 'ذخیره شد';
			await load();
		} catch (e: unknown) {
			editMessage = e instanceof Error ? e.message : 'خطا در ذخیره';
		}
	}

	function onAssign(d: DoctorCardItem) {
		selectedId = d.id;
		goto(`/appointments/book?doctor=${d.id}`);
	}

	function onSelect(d: DoctorCardItem) {
		selectedId = d.id;
		goto(`/dashboard/doctors/${d.id}`);
	}

	$effect(() => {
		if (user) load();
	});
</script>

{#if message}
	<p class="mb-4 rounded-xl bg-accent/50 px-3 py-2 text-sm">{message}</p>
{/if}
{#if error}
	<p class="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
{/if}

{#if loading && doctors.length === 0}
	<div class="flex min-h-[40vh] items-center justify-center">
		<p class="text-sm text-muted-foreground">در حال بارگذاری متخصصین...</p>
	</div>
{:else if isAdmin}
	<Card class="rounded-2xl border-border/60 shadow-sm">
		<CardContent class="space-y-5 p-4 sm:p-5">
			<DoctorsToolbar bind:filters {specialties} onAdd={() => goto('/dashboard/doctors/new')} />
			<p class="text-xs text-muted-foreground">
				{filtered.length.toLocaleString('fa-IR')} متخصص
			</p>
			<DoctorsGrid
				doctors={filtered}
				{selectedId}
				mode="manage"
				onEdit={openEdit}
				{onAssign}
				{onSelect}
			/>
		</CardContent>
	</Card>
{:else}
	<DoctorsGrid doctors={filtered} mode="directory" />
{/if}

{#if isAdmin}
	<DoctorEditDialog
		bind:open={showEdit}
		bind:form={editForm}
		message={editMessage}
		onsave={onSave}
		onfile={(f) => (photoFile = f)}
	/>
{/if}
