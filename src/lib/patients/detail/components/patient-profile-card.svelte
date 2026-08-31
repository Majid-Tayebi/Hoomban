<script lang="ts">
	import type { PatientContactInfo, PatientMetaField } from '../types';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import { Phone } from '@lucide/svelte';

	let {
		name,
		patientCode,
		avatarUrl = null,
		contact,
		meta
	}: {
		name: string;
		patientCode: string;
		avatarUrl?: string | null;
		contact: PatientContactInfo;
		meta: PatientMetaField[];
	} = $props();

	function initials(n: string): string {
		return n
			.split(' ')
			.map((w) => w.charAt(0))
			.slice(0, 2)
			.join('');
	}

	const phone = $derived(contact.phone?.trim() && contact.phone !== '—' ? contact.phone : '');
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardContent class="p-3 sm:p-4">
		<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
			<div class="flex min-w-0 items-center gap-3 sm:gap-4">
				<Avatar src={avatarUrl ?? ''} alt={name} class="h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-16">
					<div
						class="flex h-full w-full items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary ring-2 ring-primary/10 sm:text-xl"
					>
						{initials(name)}
					</div>
				</Avatar>

				<div class="min-w-0">
					<h2 class="truncate text-base font-bold leading-snug sm:text-lg">{name}</h2>
					<div
						class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground sm:text-sm"
					>
						<span class="tabular-nums" dir="ltr">{patientCode}</span>
						{#if phone}
							<span class="inline-flex items-center gap-1 tabular-nums" dir="ltr">
								<Phone class="h-3 w-3 shrink-0 text-primary" />
								{phone}
							</span>
						{/if}
					</div>
				</div>
			</div>

			{#if meta.length}
				<div
					class="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
				>
					{#each meta as field (field.label)}
						<div class="rounded-lg bg-muted/40 px-2.5 py-2">
							<p class="text-[10px] font-medium text-muted-foreground">{field.label}</p>
							<p class="mt-0.5 truncate text-xs font-semibold leading-snug sm:text-sm">
								{field.value}
							</p>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-xs text-muted-foreground lg:ms-auto lg:text-end">
					اطلاعات تکمیلی پروفایل ثبت نشده
				</p>
			{/if}
		</div>
	</CardContent>
</Card>
