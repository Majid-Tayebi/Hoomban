<script lang="ts">
	import TestsPublicShell from '$lib/components/tests-public-shell.svelte';

	let { children } = $props();
</script>

<TestsPublicShell>
	{@render children()}
</TestsPublicShell>
