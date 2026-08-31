<script lang="ts">
	import type { DoctorCardItem } from '../types';
	import DoctorCard from './doctor-card.svelte';

	let {
		doctors,
		selectedId = null,
		mode = 'manage',
		onEdit,
		onAssign,
		onSelect
	}: {
		doctors: DoctorCardItem[];
		selectedId?: string | null;
		mode?: 'manage' | 'directory';
		onEdit?: (d: DoctorCardItem) => void;
		onAssign?: (d: DoctorCardItem) => void;
		onSelect?: (d: DoctorCardItem) => void;
	} = $props();

	const isDirectory = $derived(mode === 'directory');
</script>

{#if doctors.length === 0}
	<p class="py-16 text-center text-sm text-muted-foreground">متخصصی یافت نشد.</p>
{:else}
	<div
		class={isDirectory
			? 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5'
			: 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4'}
	>
		{#each doctors as doctor (doctor.id)}
			{#if isDirectory}
				<div class="rounded-2xl">
					<DoctorCard {doctor} {mode} />
				</div>
			{:else}
				<div
					role="link"
					tabindex="0"
					class="cursor-pointer rounded-2xl outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
					onclick={() => onSelect?.(doctor)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							onSelect?.(doctor);
						}
					}}
				>
					<DoctorCard
						{doctor}
						{mode}
						selected={selectedId === doctor.id}
						onEdit={(d) => onEdit?.(d)}
						onAssign={(d) => onAssign?.(d)}
					/>
				</div>
			{/if}
		{/each}
	</div>
{/if}
