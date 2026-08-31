<script lang="ts">
	import type { DoctorDetailProfile } from '../types';
	import { getDoctorDetailPhotoUrl } from '../services/doctor-detail-data';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';

	let { profile }: { profile: DoctorDetailProfile } = $props();

	const photo = $derived(getDoctorDetailPhotoUrl(profile.id, profile.photo));
	const available = $derived(profile.availability === 'available');

	function initials(name: string): string {
		return name
			.split(' ')
			.map((w) => w.charAt(0))
			.slice(0, 2)
			.join('');
	}
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardContent class="p-4 sm:p-5">
		{#if photo}
			<img
				src={photo}
				alt={profile.displayName}
				class="mb-4 aspect-[4/5] w-full rounded-2xl object-cover object-top"
			/>
		{:else}
			<div
				class="mb-4 flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-primary/10 text-4xl font-bold text-primary"
			>
				{initials(profile.displayName)}
			</div>
		{/if}

		<p class="text-lg font-bold">{profile.displayName}</p>
		<p class="mt-0.5 text-xs text-muted-foreground" dir="ltr">{profile.code}</p>

		<div class="mt-4 grid grid-cols-3 gap-2 text-center">
			<div class="rounded-xl bg-muted/50 px-2 py-2">
				<p class="text-[10px] text-muted-foreground">تخصص</p>
				<p class="mt-0.5 text-xs font-semibold leading-snug">{profile.specialty}</p>
			</div>
			<div class="rounded-xl bg-muted/50 px-2 py-2">
				<p class="text-[10px] text-muted-foreground">سابقه</p>
				<p class="mt-0.5 text-xs font-semibold">{profile.experience}</p>
			</div>
			<div class="rounded-xl bg-muted/50 px-2 py-2">
				<p class="text-[10px] text-muted-foreground">وضعیت</p>
				<span
					class="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold {available
						? 'bg-primary/15 text-primary'
						: 'bg-red-100 text-red-600'}"
				>
					{available ? 'آماده' : 'غیرفعال'}
				</span>
			</div>
		</div>
	</CardContent>
</Card>
