<script lang="ts">
	import { getUser } from '$lib/auth.svelte';
	import { page } from '$app/stores';

	let user = $derived(getUser());
	let deskMode = $derived(user?.role === 'secretary' || user?.role === 'admin');
	let initialDoctorId = $derived($page.url.searchParams.get('doctor'));

	let BookingWizardCmp = $state<typeof import('$lib/appointments/components/booking-wizard.svelte').default | null>(
		null
	);
	let loadingWizard = $state(false);

	$effect(() => {
		if (!user || BookingWizardCmp || loadingWizard) return;
		loadingWizard = true;
		void import('$lib/appointments/components/booking-wizard.svelte').then((m) => {
			BookingWizardCmp = m.default;
			loadingWizard = false;
		});
	});
</script>

{#if !user}
	<p class="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
		برای رزرو وارد شوید.
	</p>
{:else if BookingWizardCmp}
	<BookingWizardCmp {user} {deskMode} {initialDoctorId} />
{:else}
	<div class="flex min-h-[40vh] items-center justify-center">
		<p class="text-sm text-muted-foreground">در حال بارگذاری فرم رزرو…</p>
	</div>
{/if}
