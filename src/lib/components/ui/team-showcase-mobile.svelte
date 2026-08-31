<script lang="ts">
	import { cn } from '$lib/utils';
	import { resolveDefaultLandingDoctorId } from '$lib/landing/public-data';

	type TeamMember = {
		id: string;
		name: string;
		role: string;
		image: string;
	};

	let { members = [] }: { members?: TeamMember[] } = $props();

	const defaultId = $derived(resolveDefaultLandingDoctorId(members));
	let selectedId = $state<string | null>(null);
	const activeId = $derived(
		selectedId && members.some((m) => m.id === selectedId) ? selectedId : defaultId
	);

	const selected = $derived(members.find((m) => m.id === activeId) ?? null);

	function selectMember(id: string) {
		selectedId = id;
	}

	function memberInitial(name: string) {
		return name.trim().charAt(0) || '؟';
	}
</script>

<div class="w-full select-none px-1" dir="rtl">
	<div class="grid grid-cols-3 gap-2.5">
		{#each members as member (member.id)}
			{@const isSelected = activeId === member.id}
			{@const isDimmed = activeId !== null && !isSelected}
			<button
				type="button"
				class={cn(
					'relative aspect-[3/4] overflow-hidden rounded-xl transition-all duration-300 touch-manipulation',
					isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
					isDimmed ? 'opacity-50' : 'opacity-100'
				)}
				aria-pressed={isSelected}
				aria-label={`${member.name}، ${member.role}`}
				onclick={() => selectMember(member.id)}
			>
				{#if member.image}
					<img
						src={member.image}
						alt=""
						class={cn(
							'h-full w-full object-cover object-top transition-[filter] duration-500',
							isSelected ? 'grayscale-0 brightness-100' : 'grayscale brightness-[0.77]'
						)}
					/>
				{:else}
					<div
						class={cn(
							'flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/80 to-muted text-lg font-bold transition-[filter] duration-500',
							isSelected ? 'grayscale-0 brightness-100' : 'grayscale brightness-[0.77]'
						)}
					>
						{memberInitial(member.name)}
					</div>
				{/if}
			</button>
		{/each}
	</div>

	{#if selected}
		<div
			class="mt-4 rounded-xl border border-border/50 bg-card/70 px-4 py-3 text-center transition-all duration-300"
			aria-live="polite"
		>
			<p class="text-sm font-bold leading-snug text-foreground">{selected.name}</p>
			<p class="mt-1 text-xs font-medium text-muted-foreground">{selected.role}</p>
		</div>
	{/if}
</div>
