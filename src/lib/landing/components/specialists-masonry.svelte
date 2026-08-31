<script lang="ts">
	import { cn } from '$lib/utils';
	import type { LandingDoctor } from '$lib/landing/public-data';
	import {
		DEFAULT_LANDING_DOCTOR_NAME,
		getLandingDoctorPhotoUrl
	} from '$lib/landing/public-data';

	let {
		doctors,
		onSelect
	}: {
		doctors: LandingDoctor[];
		onSelect?: (doctor: LandingDoctor) => void;
	} = $props();

	const featured = $derived.by(() => {
		const match = doctors.find((d) =>
			d.name.replace(/\s+/g, ' ').trim().includes(DEFAULT_LANDING_DOCTOR_NAME)
		);
		return match ?? doctors[Math.floor(doctors.length / 2)] ?? null;
	});

	const wingDoctors = $derived.by(() => {
		if (!featured) return { left: doctors.slice(0, 4), right: doctors.slice(4, 8) };
		const rest = doctors.filter((d) => d.id !== featured.id);
		return { left: rest.slice(0, 4), right: rest.slice(4, 8) };
	});

	function memberInitial(name: string): string {
		return name.trim().charAt(0) || '؟';
	}

	function handleSelect(doctor: LandingDoctor) {
		onSelect?.(doctor);
	}
</script>

{#snippet doctorCard(doctor: LandingDoctor, variant: 'side' | 'featured')}
	{@const photo = getLandingDoctorPhotoUrl(doctor)}
	<button
		type="button"
		class={cn(
			'group flex w-full flex-col gap-3 bg-transparent p-0 text-center',
			'transition-transform duration-200 ease-in-out hover:-translate-y-0.5',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
			variant === 'featured' && 'lg:w-[17rem] xl:w-[19rem]'
		)}
		onclick={() => handleSelect(doctor)}
	>
		<div
			class={cn(
				'relative w-full overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border/50',
				variant === 'featured'
					? 'h-72 sm:h-80 lg:h-[26rem] xl:h-[30rem]'
					: 'aspect-[3/4] min-h-[13rem] sm:min-h-[14rem] lg:min-h-[15.5rem] xl:min-h-[17rem]'
			)}
		>
			{#if photo}
				<img
					src={photo}
					alt=""
					class="h-full w-full object-cover object-top transition-transform duration-300 ease-in-out group-hover:scale-[1.02]"
					loading="lazy"
				/>
			{:else}
				<div
					class={cn(
						'flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/40 to-muted font-bold text-primary/70',
						variant === 'featured' ? 'text-5xl' : 'text-3xl'
					)}
				>
					{memberInitial(doctor.name)}
				</div>
			{/if}
		</div>

		<div class="space-y-1">
			<p
				class={cn(
					'font-bold leading-snug text-foreground',
					variant === 'featured' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
				)}
			>
				{doctor.name}
			</p>
			<p
				class={cn(
					'text-muted-foreground',
					variant === 'featured' ? 'text-sm' : 'text-xs sm:text-sm'
				)}
			>
				{doctor.specialty}
			</p>
		</div>
	</button>
{/snippet}

<!-- Mobile -->
<div class="mx-auto flex w-full max-w-xl flex-col items-center gap-6 sm:max-w-2xl lg:hidden">
	{#if featured}
		<div class="w-full max-w-[19rem]">
			{@render doctorCard(featured, 'featured')}
		</div>
	{/if}
	<div class="grid w-full grid-cols-2 gap-x-5 gap-y-7 sm:gap-x-6 sm:gap-y-8">
		{#each [...wingDoctors.left, ...wingDoctors.right] as doctor (doctor.id)}
			{@render doctorCard(doctor, 'side')}
		{/each}
	</div>
</div>

<!-- Desktop: 4 | featured | 4 -->
<div
	dir="ltr"
	class="mx-auto hidden w-full max-w-7xl items-end justify-center gap-6 lg:flex xl:max-w-[88rem] xl:gap-8"
>
	<div class="grid w-[18rem] grid-cols-2 gap-x-5 gap-y-8 xl:w-[21rem] xl:gap-x-6 xl:gap-y-9">
		{#each wingDoctors.left as doctor (doctor.id)}
			{@render doctorCard(doctor, 'side')}
		{/each}
	</div>

	{#if featured}
		<div class="shrink-0 self-center pb-1">
			{@render doctorCard(featured, 'featured')}
		</div>
	{/if}

	<div class="grid w-[18rem] grid-cols-2 gap-x-5 gap-y-8 xl:w-[21rem] xl:gap-x-6 xl:gap-y-9">
		{#each wingDoctors.right as doctor (doctor.id)}
			{@render doctorCard(doctor, 'side')}
		{/each}
	</div>
</div>
