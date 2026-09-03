<script lang="ts">
	import type { Snippet } from 'svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { Printer, X } from '@lucide/svelte';

	let {
		open = $bindable(false),
		children,
		onPrint
	}: {
		open?: boolean;
		children: Snippet;
		onPrint?: () => void;
	} = $props();

	function handlePrint() {
		open = false;
		requestAnimationFrame(() => {
			if (onPrint) onPrint();
			else window.print();
		});
	}
</script>

<Dialog
	bind:open
	class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden p-0 sm:max-w-4xl sm:p-0"
>
	<div
		class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5"
	>
		<h2 class="text-base font-semibold">پیش‌نمایش چاپ / PDF</h2>
		<div class="flex items-center gap-2">
			<Button size="sm" class="h-9 rounded-lg" onclick={handlePrint}>
				<Printer class="ms-1 h-4 w-4" />
				چاپ / دانلود
			</Button>
			<Button
				size="sm"
				variant="outline"
				class="h-9 rounded-lg"
				onclick={() => (open = false)}
				aria-label="بستن پیش‌نمایش"
			>
				<X class="h-4 w-4" />
			</Button>
		</div>
	</div>
	<div class="min-h-0 flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-6">
		<div
			class="mx-auto max-w-[210mm] rounded-lg bg-white p-6 text-foreground shadow-lg ring-1 ring-border/40 sm:p-8"
		>
			{@render children()}
		</div>
	</div>
</Dialog>
