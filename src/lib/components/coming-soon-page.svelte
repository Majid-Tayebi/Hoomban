<script lang="ts">
	import { Construction } from '@lucide/svelte';

	let {
		title,
		description
	}: {
		title: string;
		description: string;
	} = $props();
</script>

<div
	class="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card px-6 py-16 text-center shadow-sm"
>
	<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
		<Construction class="h-7 w-7" />
	</div>
	<h1 class="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
	<p class="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
	<p class="mt-4 text-xs text-muted-foreground">این صفحه در موج بعدی UI پیاده‌سازی می‌شود.</p>
</div>
