<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let {
		page = $bindable(1),
		pageSize = 10,
		total,
		class: className = ''
	}: {
		page?: number;
		pageSize?: number;
		total: number;
		class?: string;
	} = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const safePage = $derived(Math.min(Math.max(1, page), totalPages));
	const rangeStart = $derived(total === 0 ? 0 : (safePage - 1) * pageSize + 1);
	const rangeEnd = $derived(Math.min(safePage * pageSize, total));

	const pageNumbers = $derived.by(() => {
		const pages: number[] = [];
		const maxVisible = 5;
		let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
		let end = Math.min(totalPages, start + maxVisible - 1);
		start = Math.max(1, end - maxVisible + 1);
		for (let i = start; i <= end; i++) pages.push(i);
		return pages;
	});

	function goTo(next: number) {
		page = Math.min(Math.max(1, next), totalPages);
	}
</script>

{#if total > pageSize}
	<footer
		class={cn(
			'flex flex-col gap-3 border-t border-border/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5',
			className
		)}
	>
		<p class="text-xs text-muted-foreground tabular-nums">
			نمایش {rangeStart.toLocaleString('fa-IR')} تا {rangeEnd.toLocaleString('fa-IR')} از
			{total.toLocaleString('fa-IR')} مورد
		</p>

		<div class="flex items-center justify-end gap-1">
			<Button
				variant="outline"
				size="sm"
				class="h-8 gap-1 rounded-lg px-2.5 text-xs"
				disabled={safePage <= 1}
				onclick={() => goTo(safePage - 1)}
			>
				<ChevronRight class="size-3.5" />
				<span class="hidden sm:inline">قبلی</span>
			</Button>

			<div class="flex items-center gap-0.5">
				{#each pageNumbers as n (n)}
					<button
						type="button"
						class={cn(
							'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium tabular-nums transition-colors duration-200',
							n === safePage
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:bg-muted hover:text-foreground'
						)}
						aria-label="صفحه {n.toLocaleString('fa-IR')}"
						aria-current={n === safePage ? 'page' : undefined}
						onclick={() => goTo(n)}
					>
						{n.toLocaleString('fa-IR')}
					</button>
				{/each}
			</div>

			<Button
				variant="outline"
				size="sm"
				class="h-8 gap-1 rounded-lg px-2.5 text-xs"
				disabled={safePage >= totalPages}
				onclick={() => goTo(safePage + 1)}
			>
				<span class="hidden sm:inline">بعدی</span>
				<ChevronLeft class="size-3.5" />
			</Button>
		</div>
	</footer>
{/if}
