<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { page } from '$app/stores';
	import SeoHead from '$lib/components/seo-head.svelte';
	import BookingWizard from '$lib/appointments/components/booking-wizard.svelte';

	let user = $derived(getUser() ?? $page.data.user);
	let deskMode = $derived(user?.role === 'secretary' || user?.role === 'admin');
	let initialDoctorId = $derived($page.url.searchParams.get('doctor'));

	$effect(() => {
		if (!user && typeof window !== 'undefined') {
			const redirectTo = encodeURIComponent($page.url.pathname + $page.url.search);
			void goto(`/auth?redirect=${redirectTo}`);
		}
	});
</script>

<SeoHead
	title="رزرو نوبت آنلاین | کلینیک هومبان"
	description="رزرو نوبت مشاوره و ویزیت روانشناسی به‌صورت آنلاین در کلینیک هومبان"
	path="/appointments/book"
/>

{#if user}
	<BookingWizard {user} {deskMode} {initialDoctorId} />
{/if}
