<script lang="ts">
	import type { DashboardStat } from '../types';
	import StatCard from './stat-card.svelte';

	let { stats }: { stats: DashboardStat[] } = $props();
</script>

<section
	class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 {stats.length >= 4
		? 'xl:grid-cols-4'
		: 'xl:grid-cols-3'}"
>
	{#each stats as stat (stat.id)}
		<StatCard {stat} />
	{/each}
</section>
