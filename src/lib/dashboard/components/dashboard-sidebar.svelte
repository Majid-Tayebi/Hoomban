<script lang="ts">
	import type { DoctorScheduleItem } from '../types';
	import DoctorsSchedule from './doctors-schedule.svelte';

	let {
		doctors = [],
		showDoctors = true
	}: {
		doctors?: DoctorScheduleItem[];
		showDoctors?: boolean;
	} = $props();
</script>

<aside class="flex h-full min-h-0 w-full flex-col">
	{#if showDoctors}
		<DoctorsSchedule {doctors} />
	{/if}
</aside>
