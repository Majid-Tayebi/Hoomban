<script lang="ts">
	import { getUser } from '$lib/auth.svelte';
	import { page } from '$app/stores';
	import SeoHead from '$lib/components/seo-head.svelte';
	import BookingWizard from '$lib/appointments/components/booking-wizard.svelte';

	let user = $derived(getUser() ?? $page.data.user);
	let deskMode = $derived(user?.role === 'secretary' || user?.role === 'admin');
	let initialDoctorId = $derived($page.url.searchParams.get('doctor'));
</script>

<SeoHead
	title="رزرو نوبت آنلاین | کلینیک هومبان"
	description="رزرو نوبت مشاوره و ویزیت روانشناسی به‌صورت آنلاین در کلینیک هومبان"
	path="/appointments/book"
/>

{#if !user}
	<p class="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
		برای رزرو وارد شوید.
	</p>
{:else}
	<BookingWizard {user} {deskMode} {initialDoctorId} />
{/if}
