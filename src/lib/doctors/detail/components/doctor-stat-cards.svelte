<script lang="ts">
	import type { DoctorStatCard } from '../types';
	import MetricCard, { type MetricTone } from '$lib/components/ui/metric-card.svelte';
	import { CalendarDays, Users, Star } from '@lucide/svelte';

	let { stats }: { stats: DoctorStatCard[] } = $props();

	const iconMap: Record<string, typeof CalendarDays> = {
		appointments: CalendarDays,
		patients: Users,
		rating: Star
	};

	const toneMap: Record<string, MetricTone> = {
		appointments: 'sky',
		patients: 'primary',
		rating: 'amber'
	};
</script>

<div class="grid grid-cols-2 gap-3 sm:gap-4">
	{#each stats as stat (stat.id)}
		<MetricCard
			label={stat.label}
			value={stat.value}
			subtext={stat.trendLabel}
			icon={iconMap[stat.id] ?? CalendarDays}
			tone={toneMap[stat.id] ?? 'primary'}
		/>
	{/each}
</div>
