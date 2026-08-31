<script lang="ts">
	import type { QuickLink } from '../types';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import {
		CalendarDays,
		Users,
		Stethoscope,
		CalendarPlus,
		ClipboardList,
		FileText,
		Clock,
		ArrowLeft
	} from '@lucide/svelte';

	let { links }: { links: QuickLink[] } = $props();

	const icons = {
		calendar: CalendarDays,
		patients: Users,
		doctors: Stethoscope,
		book: CalendarPlus,
		tests: ClipboardList,
		articles: FileText,
		schedule: Clock
	};
</script>

{#if links.length}
	<section class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
		{#each links as link (link.id)}
			{@const Icon = icons[link.icon]}
			<button type="button" class="text-right" onclick={() => goto(link.href)}>
				<Card
					class="h-full rounded-2xl border-border/50 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
				>
					<CardContent class="flex items-center gap-3 p-4">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
						>
							<Icon class="h-5 w-5" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-semibold">{link.label}</p>
							<p class="mt-0.5 truncate text-[11px] text-muted-foreground">{link.description}</p>
						</div>
						<ArrowLeft class="h-4 w-4 shrink-0 text-muted-foreground" />
					</CardContent>
				</Card>
			</button>
		{/each}
	</section>
{/if}
