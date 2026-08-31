<script lang="ts">

	import type { CareTimelineEntry } from '../care-timeline';

	import { formatCarePeriod } from '../care-timeline';

	import Card from '$lib/components/ui/card.svelte';

	import CardHeader from '$lib/components/ui/card-header.svelte';

	import CardTitle from '$lib/components/ui/card-title.svelte';

	import CardContent from '$lib/components/ui/card-content.svelte';

	import { GitBranch, Stethoscope, Tag, ArrowRightLeft } from '@lucide/svelte';



	let { entries }: { entries: CareTimelineEntry[] } = $props();

</script>



{#if entries.length > 0}

	<Card class="rounded-2xl border-border/60 shadow-sm">

		<CardHeader class="flex-row items-center gap-2 space-y-0 px-3 pb-2 pt-3 sm:px-4">

			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">

				<GitBranch class="h-4 w-4" />

			</div>

			<div class="min-w-0">

				<CardTitle class="text-sm font-semibold">خط زمانی پرونده</CardTitle>

			</div>

		</CardHeader>

		<CardContent class="px-3 pb-3 sm:px-4">

			<ol class="relative space-y-0 border-s border-border/60 ps-3.5">

				{#each entries as entry (entry.id)}

					<li class="relative pb-3 last:pb-0">

						<span

							class="absolute -start-[1.22rem] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-border/70 bg-background"

						>

							{#if entry.kind === 'service'}

								<Tag class="h-2 w-2 text-violet-600" />

							{:else if entry.kind === 'referral'}

								<ArrowRightLeft class="h-2 w-2 text-amber-600" />

							{:else}

								<Stethoscope class="h-2 w-2 text-primary" />

							{/if}

						</span>

						<div class="min-w-0 leading-tight">

							<p class="text-[10px] tabular-nums text-muted-foreground">

								{formatCarePeriod(entry)}

							</p>

							<p class="text-xs font-medium text-foreground">{entry.title}</p>

							<p class="text-[11px] text-muted-foreground">{entry.subtitle}</p>

						</div>

					</li>

				{/each}

			</ol>

		</CardContent>

	</Card>

{/if}

