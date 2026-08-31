<script lang="ts">
	import type { AppointmentStat } from '../types';
	import AppointmentStatCard from './appointment-stat-card.svelte';

	let { stats }: { stats: AppointmentStat[] } = $props();
</script>

<section class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
	{#each stats as stat (stat.id)}
		<AppointmentStatCard {stat} />
	{/each}
</section>
