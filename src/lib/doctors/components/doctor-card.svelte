<script lang="ts">
	import type { DoctorCardItem } from '../types';
	import { formatToman } from '$lib/money';
	import { getDoctorPhotoUrl } from '../services/doctors-data';
	import { MessageSquare, Phone, MoreHorizontal, CalendarDays } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let {
		doctor,
		selected = false,
		mode = 'manage',
		onEdit,
		onAssign
	}: {
		doctor: DoctorCardItem;
		selected?: boolean;
		mode?: 'manage' | 'directory';
		onEdit?: (d: DoctorCardItem) => void;
		onAssign?: (d: DoctorCardItem) => void;
	} = $props();

	const photo = $derived(getDoctorPhotoUrl(doctor));
	const available = $derived(doctor.availability === 'available');
	const isDirectory = $derived(mode === 'directory');
	const telHref = $derived(doctor.mobile ? `tel:${doctor.mobile}` : undefined);

	function initials(name: string): string {
		return name
			.split(' ')
			.map((w) => w.charAt(0))
			.slice(0, 2)
			.join('');
	}
</script>

<article
	class={cn(
		isDirectory
			? 'overflow-hidden rounded-2xl border border-border/60 bg-card p-0 shadow-sm transition-all duration-200 hover:shadow-md'
			: cn(
					'group flex flex-col rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 ease-in-out sm:p-5',
					selected
						? 'border-primary/50 bg-primary/[0.03] ring-1 ring-primary/30'
						: 'border-border/60 hover:border-primary/30 hover:shadow-md'
				)
	)}
>
	{#if !isDirectory}
		<div class="mb-3 flex items-start justify-between gap-2">
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-bold sm:text-base md:hidden">{doctor.displayName}</p>
				<span
					class={cn(
						'mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold sm:text-[11px]',
						available
							? 'bg-primary/15 text-primary'
							: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
					)}
				>
					{available ? 'آماده' : 'غیرفعال'}
				</span>
			</div>
			<button
				type="button"
				class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				aria-label="گزینه‌ها"
				onclick={(e) => {
					e.stopPropagation();
					onEdit?.(doctor);
				}}
			>
				<MoreHorizontal class="h-4 w-4" />
			</button>
		</div>

		<div class="mx-auto mb-3 flex w-full max-w-[200px] flex-col items-center">
			{#if photo}
				<img
					src={photo}
					alt={doctor.displayName}
					class="aspect-square w-full rounded-2xl object-cover object-top"
					loading="lazy"
					decoding="async"
				/>
			{:else}
				<div
					class="flex aspect-square w-full items-center justify-center rounded-2xl bg-primary/10 text-3xl font-bold text-primary"
				>
					{initials(doctor.displayName)}
				</div>
			{/if}
		</div>

		<div class="mb-4 text-center md:text-right">
			<p class="hidden truncate text-base font-bold md:block">{doctor.displayName}</p>
			<p class="mt-1 text-sm font-semibold text-foreground">{doctor.specialty}</p>
			<p class="mt-1 text-xs text-muted-foreground">{doctor.workingHours}</p>
			{#if doctor.location}
				<p class="mt-0.5 text-[11px] text-muted-foreground md:hidden">{doctor.location}</p>
			{/if}
			{#if doctor.mobile}
				<p class="mt-1.5 text-xs text-muted-foreground" dir="ltr">{doctor.mobile}</p>
			{/if}
			{#if doctor.visitFee > 0}
				<p class="mt-1.5 text-xs text-muted-foreground">
					تعرفه: {formatToman(doctor.visitFee)}
				</p>
			{/if}
		</div>

		<div class="mt-auto flex items-center gap-2">
			<button
				type="button"
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				aria-label="پیام"
				onclick={(e) => e.stopPropagation()}
			>
				<MessageSquare class="h-4 w-4" />
			</button>
			{#if telHref}
				<a
					href={telHref}
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label="تماس"
					onclick={(e) => e.stopPropagation()}
				>
					<Phone class="h-4 w-4" />
				</a>
			{:else}
				<button
					type="button"
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label="تماس"
					onclick={(e) => e.stopPropagation()}
				>
					<Phone class="h-4 w-4" />
				</button>
			{/if}
			<button
				type="button"
				class="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				onclick={(e) => {
					e.stopPropagation();
					onAssign?.(doctor);
				}}
			>
				<CalendarDays class="h-4 w-4 shrink-0" />
				<span class="truncate">ارجاع بیمار</span>
			</button>
		</div>
	{:else}
		<div class="relative aspect-[3/4] w-full">
			{#if photo}
				<img
					src={photo}
					alt={doctor.displayName}
					class="absolute inset-0 h-full w-full object-cover object-top"
					loading="lazy"
					decoding="async"
				/>
			{:else}
				<div
					class="absolute inset-0 flex items-center justify-center bg-primary/10 text-3xl font-bold text-primary"
				>
					{initials(doctor.displayName)}
				</div>
			{/if}
			<p
				class="absolute start-3 top-3 max-w-[calc(100%-1.5rem)] truncate text-sm font-bold text-white drop-shadow-md sm:text-base"
			>
				{doctor.displayName}
			</p>
		</div>

		<div class="flex items-center justify-between gap-3 bg-card px-3 py-2.5">
			<p class="min-w-0 truncate text-sm font-semibold text-foreground">{doctor.specialty}</p>
			{#if doctor.mobile}
				<a
					href={telHref}
					class="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
					dir="ltr"
					onclick={(e) => e.stopPropagation()}
				>
					<Phone class="h-3.5 w-3.5 shrink-0" />
					<span class="tabular-nums">{doctor.mobile}</span>
				</a>
			{:else}
				<span class="shrink-0 text-xs text-muted-foreground">شماره ثبت نشده</span>
			{/if}
		</div>
	{/if}
</article>
