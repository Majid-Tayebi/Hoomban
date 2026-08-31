<script lang="ts">
	import type { ScheduleCategory, ScheduleCategoryId } from '../types';
	import { categoryToneClass } from '../utils/calendar-grid';
	import { X } from '@lucide/svelte';

	let {
		categories,
		total,
		active,
		onToggle,
		onClose
	}: {
		categories: ScheduleCategory[];
		total: number;
		active: Set<ScheduleCategoryId>;
		onToggle: (id: ScheduleCategoryId) => void;
		onClose?: () => void;
	} = $props();
</script>

<div class="flex h-full flex-col rounded-2xl border bg-card">
	<div class="flex items-center justify-between border-b px-4 py-3">
		<h2 class="text-sm font-semibold">فیلتر</h2>
		{#if onClose}
			<button
				type="button"
				class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
				onclick={onClose}
				aria-label="بستن"
			>
				<X class="h-4 w-4" />
			</button>
		{/if}
	</div>

	<div class="space-y-4 p-4">
		<p class="text-xs text-muted-foreground">
			مجموع برنامه‌ها:
			<span class="font-semibold text-foreground">{total.toLocaleString('fa-IR')}</span>
		</p>

		<ul class="space-y-2">
			{#each categories as cat}
				{@const tone = categoryToneClass(cat.tone)}
				{@const isOn = active.has(cat.id)}
				<li>
					<button
						type="button"
						class="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition-colors
							{isOn ? 'border-border bg-background' : 'border-transparent bg-muted/40 opacity-60'}"
						onclick={() => onToggle(cat.id)}
					>
						<span class="h-8 w-1 shrink-0 rounded-full {tone.bar}"></span>
						<span class="min-w-0 flex-1">
							<span class="block text-xs font-medium text-foreground">{cat.label}</span>
							<span class="mt-0.5 block text-[11px] text-muted-foreground">
								{cat.count.toLocaleString('fa-IR')} برنامه
							</span>
						</span>
						<span
							class="flex h-5 w-5 items-center justify-center rounded-md border text-[10px]
								{isOn ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}"
						>
							{#if isOn}✓{/if}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	</div>
</div>
