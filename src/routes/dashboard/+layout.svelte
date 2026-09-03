<script lang="ts">
	import AppShell from '$lib/components/app-shell.svelte';
	import { getUser, isAuthHydrated } from '$lib/auth.svelte';
	import { canAccessPath } from '$lib/rbac';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { registerServiceWorker } from '$lib/push/push-client';
	import { hydrateAuthFromSession } from '$lib/auth.svelte';

	let { children, data } = $props();

	let user = $derived(getUser() ?? data.user);
	let hydrated = $derived(isAuthHydrated());
	let pathname = $derived($page.url.pathname);

	$effect(() => {
		if (!browser) return;
		void registerServiceWorker().catch(() => {
			/* SW only in production build */
		});
	});

	$effect(() => {
		if (!browser) return;
		void hydrateAuthFromSession();
	});

	/** Secondary client guard — primary enforcement is +layout.server.ts */
	$effect(() => {
		if (!hydrated || !user) return;
		if (!canAccessPath(pathname, user.role)) {
			goto('/dashboard');
		}
	});
</script>

<AppShell fallbackUser={data.user}>
	{@render children()}
</AppShell>
