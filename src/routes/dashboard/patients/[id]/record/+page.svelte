<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { canAccessPatientRecord, canViewClinicalNotes } from '$lib/rbac';
	import { loadPatientDetail } from '$lib/patients/detail';
	import type { PatientDetailData } from '$lib/patients/detail/types';
	import PatientRecordDocument from '$lib/patients/detail/components/patient-record-document.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { ArrowRight, Printer } from '@lucide/svelte';

	let user = $derived(getUser());
	let patientId = $derived($page.params.id);
	let canNotes = $derived(canViewClinicalNotes(user?.role));

	let data = $state<PatientDetailData | null>(null);
	let loading = $state(true);
	let error = $state('');
	const generatedAt = new Date();

	async function load() {
		if (!patientId || !user) return;
		loading = true;
		error = '';
		try {
			const result = await loadPatientDetail(patientId, user, !!canNotes);
			data = result.data;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'خطا در بارگذاری پرونده';
			data = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const uid = user?.id;
		const pid = patientId;
		if (!uid || !pid) return;
		if (!canAccessPatientRecord(user?.role)) {
			goto('/dashboard');
			return;
		}
		void load();
	});
</script>

<svelte:head>
	<title>پرونده مراجع · هومبان</title>
</svelte:head>

<div class="space-y-4">
	<div class="print:hidden flex flex-wrap items-center justify-between gap-2">
		<button
			type="button"
			class="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground sm:text-sm"
			onclick={() => goto(`/dashboard/patients/${patientId}`)}
		>
			<ArrowRight class="h-4 w-4" />
			بازگشت به پرونده
		</button>
		<div class="flex flex-wrap gap-2">
			<Button
				variant="outline"
				class="rounded-xl transition-all duration-200"
				disabled={!data}
				onclick={() => window.print()}
			>
				<Printer class="h-4 w-4" />
				دانلود PDF / چاپ
			</Button>
		</div>
	</div>

	{#if loading}
		<p class="text-sm text-muted-foreground">در حال آماده‌سازی پرونده...</p>
	{:else if error || !data}
		<p class="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
			{error || 'مراجع یافت نشد'}
		</p>
	{:else}
		<div class="print:p-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm print:border-0 print:bg-transparent print:shadow-none sm:p-6">
			<PatientRecordDocument {data} {generatedAt} />
		</div>
	{/if}
</div>
