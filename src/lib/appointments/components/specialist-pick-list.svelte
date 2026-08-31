<script lang="ts">
	import type { BookingDoctor } from '../booking-types';
	import { formatToman } from '$lib/money';
	import { getBookingDoctorPhotoUrl } from '../services/booking';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import { Plus, Check } from '@lucide/svelte';

	let {
		doctors,
		selectedId = null,
		loading = false,
		onSelect
	}: {
		doctors: BookingDoctor[];
		selectedId?: string | null;
		loading?: boolean;
		onSelect: (doctor: BookingDoctor) => void;
	} = $props();
</script>

{#if loading}
	<p class="py-10 text-center text-sm text-muted-foreground">در حال بارگذاری متخصصان...</p>
{:else if doctors.length === 0}
	<p class="py-10 text-center text-sm text-muted-foreground">متخصص فعالی یافت نشد.</p>
{:else}
	<ul class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
		{#each doctors as doctor (doctor.id)}
			{@const photo = getBookingDoctorPhotoUrl(doctor)}
			{@const selected = selectedId === doctor.id}
			<li>
				<button
					type="button"
					class="flex h-full w-full items-center gap-3 rounded-2xl border border-border/60 px-3.5 py-3 text-right transition-all duration-200 hover:border-primary/40 hover:bg-muted/30 {selected
						? 'border-primary bg-primary/5'
						: 'bg-card'}"
					onclick={() => onSelect(doctor)}
				>
					<Avatar class="h-10 w-10 shrink-0" src={photo || ''} alt={doctor.name} />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold">{doctor.name}</p>
						<p class="truncate text-xs text-muted-foreground">{doctor.specialty}</p>
						<p class="mt-0.5 truncate text-[11px] text-muted-foreground">
							{formatToman(doctor.visitFee)} · {doctor.slotDuration.toLocaleString(
								'fa-IR'
							)} دقیقه
						</p>
					</div>
					<span
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors duration-200 {selected
							? 'border-primary bg-primary text-primary-foreground'
							: ''}"
					>
						{#if selected}
							<Check class="h-4 w-4" />
						{:else}
							<Plus class="h-4 w-4" />
						{/if}
					</span>
				</button>
			</li>
		{/each}
	</ul>
{/if}
