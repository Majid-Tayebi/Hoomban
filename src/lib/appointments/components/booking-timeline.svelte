<script lang="ts">
	import type { BookingTimelineStep } from '../booking-types';
	import { Check, Clock } from '@lucide/svelte';

	let {
		steps,
		currentStep
	}: {
		steps: BookingTimelineStep[];
		currentStep: number;
	} = $props();
</script>

<ol class="relative space-y-0 pe-1">
	{#each steps as step, i (step.id)}
		{@const done = currentStep > step.id}
		{@const active = currentStep === step.id}
		{@const upcoming = currentStep < step.id}
		<li class="relative flex gap-3 pb-6 last:pb-0">
			{#if i < steps.length - 1}
				<span
					class="absolute start-[15px] top-8 bottom-0 w-px {done ? 'bg-primary' : 'bg-border'}"
					aria-hidden="true"
				></span>
			{/if}
			<div class="relative z-10 flex shrink-0 flex-col items-center">
				{#if done}
					<span
						class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
					>
						<Check class="h-4 w-4" strokeWidth={2.5} />
					</span>
				{:else if active}
					<span
						class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-primary"
					>
						<Clock class="h-4 w-4" />
					</span>
				{:else}
					<span
						class="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground"
					>
						{step.id}
					</span>
				{/if}
			</div>
			<div class="min-w-0 flex-1 pt-0.5">
				<p
					class="text-sm font-semibold {upcoming ? 'text-muted-foreground' : 'text-foreground'}"
				>
					{step.title}
				</p>
				<p class="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
			</div>
		</li>
	{/each}
</ol>
