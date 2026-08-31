<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { canAccessPatientRecord, canViewClinicalNotes, canWriteClinicalNotes } from '$lib/rbac';
	import { loadPatientDetail } from '$lib/patients/detail';
	import type { PatientDetailData } from '$lib/patients/detail/types';
	import PatientProfileCard from '$lib/patients/detail/components/patient-profile-card.svelte';
	import PatientAppointments from '$lib/patients/detail/components/patient-appointments.svelte';
	import PatientCareTimeline from '$lib/patients/detail/components/patient-care-timeline.svelte';
	import { buildCareTimeline } from '$lib/patients/detail/care-timeline';
	import ClinicalNotesPanel from '$lib/patients/detail/components/clinical-notes-panel.svelte';
	import PatientAttachmentsPanel from '$lib/patients/detail/components/patient-attachments-panel.svelte';
	import PatientReferralPanel from '$lib/patients/detail/components/patient-referral-panel.svelte';
	import PatientVitals from '$lib/patients/detail/components/patient-vitals.svelte';
	import MedicalInfo from '$lib/patients/detail/components/medical-info.svelte';
	import BloodPressureChart from '$lib/patients/detail/components/blood-pressure-chart.svelte';
	import { formatFaDateTime } from '$lib/date';
	import { loadPatientAttachments } from '$lib/patients/detail/services/patient-attachments';
	import Button from '$lib/components/ui/button.svelte';
	import { ArrowRight, FileDown } from '@lucide/svelte';

	let user = $derived(getUser());
	let patientId = $derived($page.params.id);
	let canNotes = $derived(canViewClinicalNotes(user?.role));
	let canWrite = $derived(canWriteClinicalNotes(user?.role));

	let data = $state<PatientDetailData | null>(null);
	let doctorRecordId = $state<string | null>(null);
	let loading = $state(true);
	let error = $state('');

	const careTimeline = $derived(
		data ? buildCareTimeline(data.appointments, data.referrals) : []
	);

	const appointmentOptions = $derived(
		data?.appointments
			.filter((a) => a.kind === 'specialist')
			.map((a) => ({
				id: a.id,
				label: `${formatFaDateTime(a.dateTime)} — ${a.displayName}`
			})) ?? []
	);

	let loadSeq = 0;

	async function load() {
		if (!patientId || !user) return;
		const seq = ++loadSeq;
		loading = true;
		error = '';
		try {
			const result = await loadPatientDetail(patientId, user, !!canNotes);
			if (seq !== loadSeq) return;
			data = result.data;
			doctorRecordId = result.doctorRecordId;
		} catch (e: unknown) {
			if (seq !== loadSeq) return;
			const msg = e instanceof Error ? e.message : 'خطا در بارگذاری پرونده';
			error = msg.includes('autocancelled') || msg.includes('aborted')
				? 'بارگذاری لغو شد — دوباره تلاش کنید.'
				: msg;
			data = null;
		} finally {
			if (seq === loadSeq) loading = false;
		}
	}

	async function refreshAttachments() {
		if (!patientId || !data) return;
		try {
			data.attachments = await loadPatientAttachments(patientId);
		} catch {
			/* keep current list */
		}
	}

	$effect(() => {
		const role = user?.role;
		const uid = user?.id;
		const pid = patientId;
		if (!uid || !pid) return;
		if (!canAccessPatientRecord(role)) {
			goto('/dashboard');
			return;
		}
		void load();
	});
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
			<button
				type="button"
				class="inline-flex items-center gap-1 transition-colors duration-200 hover:text-foreground"
				onclick={() => goto('/dashboard/patients')}
			>
				<ArrowRight class="h-4 w-4" />
				مراجعان
			</button>
			<span>/</span>
			<span class="font-medium text-foreground">جزئیات مراجعه</span>
		</div>
		{#if canNotes && data}
			<Button
				variant="outline"
				size="sm"
				class="rounded-xl transition-all duration-200 print:hidden"
				onclick={() => goto(`/dashboard/patients/${patientId}/record`)}
			>
				<FileDown class="h-4 w-4" />
				دانلود پرونده
			</Button>
		{/if}
	</div>

	{#if loading}
		<div class="flex min-h-[40vh] items-center justify-center">
			<p class="text-sm text-muted-foreground">در حال بارگذاری پرونده...</p>
		</div>
	{:else if error || !data}
		<p class="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
			{error || 'مراجع یافت نشد'}
		</p>
	{:else}
		<PatientProfileCard
			name={data.name}
			patientCode={data.patientCode}
			avatarUrl={data.avatarUrl}
			contact={data.contact}
			meta={data.meta}
		/>

		<div class="grid gap-3 lg:grid-cols-2 lg:items-start xl:gap-4">
			<div class="space-y-3 xl:space-y-4">
				<PatientAppointments appointments={data.appointments} />
				{#if user}
					<PatientReferralPanel
						bind:referrals={data.referrals}
						patientId={data.id}
						doctorId={doctorRecordId}
						userId={user.id}
						isAdmin={user.role === 'admin'}
						canCreate={canWrite && !!doctorRecordId}
						onChanged={load}
					/>
				{/if}
				<PatientCareTimeline entries={careTimeline} />
			</div>

			{#if canNotes && user}
				<div class="space-y-3 xl:space-y-4">
					{#if data.vitals.length}
						<PatientVitals vitals={data.vitals} />
					{/if}
					{#if data.vitalsChart}
						<BloodPressureChart chartData={data.vitalsChart} />
					{/if}
					{#if data.conditions.length || data.allergies.length || data.medications.length}
						<MedicalInfo
							conditions={data.conditions}
							allergies={data.allergies}
							medications={data.medications}
						/>
					{/if}

					<ClinicalNotesPanel
						bind:notes={data.notes}
						patientId={data.id}
						doctorId={doctorRecordId}
						userId={user.id}
						{canWrite}
						appointments={appointmentOptions}
						onRefresh={load}
					/>

					<PatientAttachmentsPanel
						bind:attachments={data.attachments}
						patientId={data.id}
						doctorId={doctorRecordId ?? ''}
						userId={user.id}
						canWrite={!!doctorRecordId && (canWrite || user.role === 'admin')}
						onChanged={refreshAttachments}
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>
