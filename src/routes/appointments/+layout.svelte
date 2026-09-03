<script lang="ts">
	/** Public booking routes — no dashboard shell (avoids auth-hydration blocking). */
	let { children } = $props();
</script>

<div class="min-h-dvh bg-background">
	{@render children()}
</div>
