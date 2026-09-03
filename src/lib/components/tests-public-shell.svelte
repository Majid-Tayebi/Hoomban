<script lang="ts">
	import LandingNavbar from '$lib/components/ui/landing-navbar.svelte';
	import { getUser } from '$lib/auth.svelte';

	let { children } = $props();
	let user = $derived(getUser());
</script>

<div class="min-h-dvh bg-background text-foreground">
	<div class="print:hidden">
		<LandingNavbar {user} />
	</div>
	<main class="mx-auto w-full max-w-6xl px-4 py-6 print:max-w-none print:px-0 print:py-0 sm:px-6 sm:py-8">
		{@render children()}
	</main>
</div>
