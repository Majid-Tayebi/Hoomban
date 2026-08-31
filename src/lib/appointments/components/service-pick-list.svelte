<script lang="ts">
	import type { BookingService } from '../booking-types';
	import { formatToman } from '$lib/money';
	import { Tag, Plus, Check } from '@lucide/svelte';

	let {
		services,
		selectedId = null,
		loading = false,
		onSelect
	}: {
		services: BookingService[];
		selectedId?: string | null;
		loading?: boolean;
		onSelect: (service: BookingService) => void;
	} = $props();
</script>

{#if loading}
	<p class="py-10 text-center text-sm text-muted-foreground">در حال بارگذاری خدمات...</p>
{:else if services.length === 0}
	<p class="py-10 text-center text-sm text-muted-foreground">خدمت فعالی یافت نشد.</p>
{:else}
	<ul class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
		{#each services as service (service.id)}
			{@const selected = selectedId === service.id}
			<li>
				<button
					type="button"
					class="flex h-full w-full items-center gap-3 rounded-2xl border border-border/60 px-3.5 py-3 text-right transition-all duration-200 hover:border-primary/40 hover:bg-muted/30 {selected
						? 'border-primary bg-primary/5'
						: 'bg-card'}"
					onclick={() => onSelect(service)}
				>
					<span
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
					>
						<Tag class="h-4 w-4" />
					</span>
					<div class="min-w-0 flex-1">
						{#if service.category}
							<p class="mb-0.5 text-[10px] font-medium text-primary">{service.category}</p>
						{/if}
						<p class="truncate text-sm font-semibold">{service.title}</p>
						<p class="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
							{service.description || 'بدون توضیح'}
						</p>
						{#if service.price > 0}
							<p class="mt-1 truncate text-[11px] font-medium tabular-nums text-foreground">
								{formatToman(service.price)}
							</p>
						{/if}
					</div>
					<span
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors duration-200 {selected
							? 'border-primary bg-primary text-primary-foreground'
							: ''}"
					>
						{#if selected}
							<Check class="h-4 w-4" />
						{:else}
							<Plus class="h-4 w-4" />
						{/if}
					</span>
				</button>
			</li>
		{/each}
	</ul>
{/if}
