<script lang="ts">
	import { getUser } from '$lib/auth.svelte';
	import { page } from '$app/stores';
	import BookingWizard from '$lib/appointments/components/booking-wizard.svelte';

	let user = $derived(getUser());
	let deskMode = $derived(user?.role === 'secretary' || user?.role === 'admin');
	let initialDoctorId = $derived($page.url.searchParams.get('doctor'));
</script>

{#if !user}
	<p class="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
		برای رزرو وارد شوید.
	</p>
{:else}
	<BookingWizard {user} {deskMode} {initialDoctorId} />
{/if}
