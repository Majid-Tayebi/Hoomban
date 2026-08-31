<script lang="ts">
	import type { DoctorDetailProfile } from '../types';
	import { formatToman } from '$lib/money';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { Mail, Phone, MapPin, Building2, Calendar, HeartPulse } from '@lucide/svelte';

	let { profile }: { profile: DoctorDetailProfile } = $props();

	const fields = $derived([
		{ icon: Building2, label: 'اتاق / بخش', value: profile.room },
		{ icon: Phone, label: 'تلفن', value: profile.phone },
		{ icon: Mail, label: 'ایمیل', value: profile.email },
		{ icon: Calendar, label: 'تاریخ همکاری', value: profile.joinDate },
		{ icon: HeartPulse, label: 'تماس اضطراری', value: profile.emergencyContact },
		{ icon: MapPin, label: 'آدرس', value: profile.address }
	]);
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="pb-2 pt-4 px-4 sm:px-5">
		<CardTitle class="text-sm font-semibold sm:text-base">درباره متخصص</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4 px-4 pb-4 sm:px-5">
		<p class="text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>

		{#if profile.visitFee > 0}
			<p class="text-xs text-muted-foreground">
				تعرفه ویزیت:
				<strong class="text-foreground">{formatToman(profile.visitFee)}</strong>
				· مدت جلسه {profile.slotDuration.toLocaleString('fa-IR')} دقیقه
			</p>
		{/if}

		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each fields as field}
				<div class="flex gap-2.5 rounded-xl bg-muted/40 p-3">
					<field.icon class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
					<div class="min-w-0">
						<p class="text-[10px] text-muted-foreground">{field.label}</p>
						<p class="truncate text-xs font-medium sm:text-sm">{field.value}</p>
					</div>
				</div>
			{/each}
		</div>
	</CardContent>
</Card>
