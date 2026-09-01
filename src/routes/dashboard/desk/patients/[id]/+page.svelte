<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { canAccessSecretaryPatientDesk } from '$lib/rbac';
	import { loadPatientDesk, refreshPatientDeskAccounting } from '$lib/desk';
	import type { PatientDeskData } from '$lib/desk/types';
	import PatientProfileCard from '$lib/patients/detail/components/patient-profile-card.svelte';
	import PatientAppointments from '$lib/patients/detail/components/patient-appointments.svelte';
	import PatientCareTimeline from '$lib/patients/detail/components/patient-care-timeline.svelte';
	import { buildCareTimeline } from '$lib/patients/detail/care-timeline';
	import PatientAccountingPanel from '$lib/desk/components/patient-accounting-panel.svelte';
	import SecretarySmsDialog from '$lib/desk/components/secretary-sms-dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { ArrowRight, MessageSquareText } from '@lucide/svelte';

	let user = $derived(getUser());
	let patientId = $derived($page.params.id);
	let fromSource = $derived($page.url.searchParams.get('from'));

	const backHref = $derived(
		fromSource === 'accounting' ? '/dashboard/desk/accounting' : '/dashboard/appointments'
	);
	const backLabel = $derived(fromSource === 'accounting' ? 'حسابداری' : 'نوبت‌ها');

	let data = $state<PatientDeskData | null>(null);
	let loading = $state(true);
	let error = $state('');
	let smsOpen = $state(false);

	const careTimeline = $derived(data ? buildCareTimeline(data.appointments) : []);

	async function load() {
		if (!patientId || !user) return;
		loading = true;
		error = '';
		try {
			data = await loadPatientDesk(patientId, user);
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'خطا در بارگذاری پرونده';
			data = null;
		} finally {
			loading = false;
		}
	}

	async function refreshAccounting() {
		if (!patientId || !data) return;
		try {
			const patch = await refreshPatientDeskAccounting(patientId, data.appointments);
			data = { ...data, accounting: patch.accounting, meta: patch.meta };
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'خطا در به‌روزرسانی حسابداری';
		}
	}

	$effect(() => {
		if (user && !canAccessSecretaryPatientDesk(user.role)) {
			goto('/dashboard');
			return;
		}
		const pid = patientId;
		const uid = user?.id;
		if (pid && uid && canAccessSecretaryPatientDesk(user!.role)) {
			load();
		}
	});
</script>

<div class="space-y-4 sm:space-y-5">
	<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
		<button
			type="button"
			class="inline-flex items-center gap-1 transition-colors duration-200 hover:text-foreground"
			onclick={() => goto(backHref)}
		>
			<ArrowRight class="h-4 w-4" />
			{backLabel}
		</button>
		<span>/</span>
		<span class="font-medium text-foreground">پرونده مراجع (منشی)</span>
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
			contact={{
				phone: data.contact.phone,
				email: data.contact.email,
				address: '—',
				emergencyContact: data.contact.emergencyContact
			}}
			meta={data.meta}
		/>

		<div class="flex justify-end">
			<Button variant="outline" class="rounded-xl gap-2" onclick={() => (smsOpen = true)}>
				<MessageSquareText class="h-4 w-4" />
				ارسال پیامک
			</Button>
		</div>

		<SecretarySmsDialog
			bind:open={smsOpen}
			phone={data.contact.phone}
			patientName={data.name}
		/>

		<PatientAccountingPanel
			patientUserId={data.id}
			userId={user?.id || ''}
			bind:accounting={data.accounting}
			onUpdated={refreshAccounting}
		/>

		<PatientAppointments appointments={data.appointments} />

		<PatientCareTimeline entries={careTimeline} />
	{/if}
</div>
