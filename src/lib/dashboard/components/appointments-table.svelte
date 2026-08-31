<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { getPatientRecordHref } from '$lib/rbac';
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import type { DashboardAppointment, AppointmentStatus } from '../types';
	import { formatFaDate, formatFaTime, startOfDay } from '$lib/date';
	import { cn } from '$lib/utils';
	import { ArrowLeft, CalendarDays, MapPin, Phone, Video } from '@lucide/svelte';

	let {
		appointments,
		loading = false,
		title = 'نوبت‌ها',
		variant = 'clinic',
		clickablePatients = false,
		viewAllHref = '/dashboard/appointments',
		inProgress = false
	}: {
		appointments: DashboardAppointment[];
		loading?: boolean;
		title?: string;
		variant?: 'clinic' | 'patient' | 'doctor';
		clickablePatients?: boolean;
		viewAllHref?: string;
		inProgress?: boolean;
	} = $props();

	const user = $derived(getUser());
	const todayStart = startOfDay(new Date());

	function openPatient(patientUserId: string) {
		if (!clickablePatients || !patientUserId || !user) return;
		goto(getPatientRecordHref(patientUserId, user.role));
	}

	const statusConfig: Record<
		AppointmentStatus,
		{ label: string; class: string; stripe: string }
	> = {
		completed: {
			label: 'تکمیل‌شده',
			class: 'bg-primary/15 text-primary',
			stripe: 'bg-primary'
		},
		scheduled: {
			label: 'زمان‌بندی',
			class: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
			stripe: 'bg-sky-500'
		},
		cancelled: {
			label: 'لغو',
			class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
			stripe: 'bg-red-500'
		},
		pending: {
			label: 'در انتظار',
			class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
			stripe: 'bg-amber-500'
		},
		reserved: {
			label: 'رزرو',
			class: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
			stripe: 'bg-sky-500'
		},
		confirmed: {
			label: 'تأیید',
			class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
			stripe: 'bg-emerald-500'
		},
		ongoing: {
			label: 'در جریان',
			class: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
			stripe: 'bg-violet-500'
		}
	};

	function formatPhone(phone: string): string {
		if (phone === '—') return phone;
		return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
	}

	function isToday(date: Date): boolean {
		return date >= todayStart && date < new Date(todayStart.getTime() + 86_400_000);
	}

	function dateLabel(date: Date): string {
		return isToday(date) ? 'امروز' : formatFaDate(date);
	}

	function rowInteractive(patientUserId: string): boolean {
		return clickablePatients && Boolean(patientUserId);
	}

	type StatusStyle = (typeof statusConfig)[AppointmentStatus];
</script>

{#snippet appointmentRow(apt: DashboardAppointment, status: StatusStyle)}
	<div class={cn('absolute inset-y-3 start-0 w-1 rounded-full', status.stripe)} aria-hidden="true"></div>

	<div
		class="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-muted/40 px-1 py-2 text-center sm:w-16"
	>
		<p class="text-[10px] font-medium text-muted-foreground">{dateLabel(apt.dateTime)}</p>
		<p class="mt-0.5 text-sm font-bold tabular-nums leading-none">{formatFaTime(apt.dateTime)}</p>
	</div>

	<div class="min-w-0 flex-1">
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0">
				{#if variant === 'patient'}
					<p class="truncate text-sm font-semibold">{apt.doctorName}</p>
					<p class="mt-0.5 truncate text-xs text-muted-foreground">{apt.specialty}</p>
				{:else}
					<p class="truncate text-sm font-semibold">{apt.patientName}</p>
					<bdi
						class="mt-0.5 block truncate text-end text-[11px] tabular-nums text-muted-foreground"
						dir="ltr"
					>
						{apt.patientId}
					</bdi>
				{/if}
			</div>
			<Badge class={cn('shrink-0 border-0 px-2 py-0.5 text-[10px] font-medium', status.class)}>
				{status.label}
			</Badge>
		</div>

		<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
			{#if variant === 'clinic' || variant === 'patient'}
				{#if variant === 'clinic'}
					<span class="truncate">{apt.doctorName}</span>
					<span class="text-border">·</span>
				{/if}
				<span class="truncate">{apt.specialty}</span>
			{/if}

			{#if variant === 'clinic' || variant === 'doctor'}
				<span class="inline-flex items-center gap-1 tabular-nums">
					<Phone class="h-3 w-3 shrink-0" />
					<bdi dir="ltr">{formatPhone(apt.phone)}</bdi>
				</span>
			{/if}

			<span class="inline-flex items-center gap-1">
				{#if apt.type.includes('آنلاین')}
					<Video class="h-3 w-3 shrink-0" />
				{:else}
					<MapPin class="h-3 w-3 shrink-0" />
				{/if}
				{apt.type}
			</span>
		</div>
	</div>
{/snippet}

<section class="overflow-hidden rounded-2xl border border-border/55 bg-card shadow-sm">
	<header class="flex items-start justify-between gap-3 border-b border-border/40 bg-muted/20 px-4 py-3.5 sm:px-5">
		<div class="min-w-0">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/15 dark:text-sky-400"
				>
					<CalendarDays class="h-4 w-4" />
				</div>
				<h2 class="text-base font-semibold tracking-tight">{title}</h2>
			</div>
			<p class="mt-1.5 text-xs text-muted-foreground">
				{#if loading}
					در حال بارگذاری...
				{:else if inProgress}
					نوبت‌های فعال امروز و ۷ روز آینده
				{:else if appointments.length}
					{appointments.length.toLocaleString('fa-IR')} مورد اخیر
				{:else}
					موردی برای نمایش نیست
				{/if}
			</p>
		</div>
		{#if viewAllHref}
			<Button
				variant="ghost"
				size="sm"
				class="hidden h-8 shrink-0 gap-1 text-xs text-muted-foreground hover:text-foreground sm:inline-flex"
				onclick={() => goto(viewAllHref)}
			>
				مشاهده همه
				<ArrowLeft class="h-3.5 w-3.5" />
			</Button>
		{/if}
	</header>

	{#if !appointments.length && !loading}
		<div class="flex flex-col items-center justify-center gap-2 px-5 py-14 text-center">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<CalendarDays class="h-5 w-5" />
			</div>
			<p class="text-sm font-medium">
				{inProgress ? 'نوبت فعالی در بازه جاری نیست' : 'هنوز نوبتی ثبت نشده است'}
			</p>
			<p class="max-w-xs text-xs text-muted-foreground">
				{inProgress
					? 'نوبت‌های رزرو، تأیید یا در انتظار در اینجا نمایش داده می‌شوند.'
					: 'پس از ثبت نوبت، لیست اینجا به‌روز می‌شود.'}
			</p>
		</div>
	{:else}
		<ul class="divide-y divide-border/40">
			{#each appointments as apt (apt.id)}
				{@const status = statusConfig[apt.status]}
				{@const interactive = rowInteractive(apt.patientUserId)}
				<li>
					{#if interactive}
						<button
							type="button"
							class="relative flex w-full gap-3 px-4 py-3.5 text-start transition-colors duration-200 hover:bg-muted/30 sm:gap-4 sm:px-5 sm:py-4"
							onclick={() => openPatient(apt.patientUserId)}
						>
							{@render appointmentRow(apt, status)}
						</button>
					{:else}
						<div
							class="relative flex w-full gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4"
						>
							{@render appointmentRow(apt, status)}
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		{#if viewAllHref}
			<div class="border-t border-border/40 px-3 py-2.5 sm:hidden">
				<Button
					variant="ghost"
					size="sm"
					class="h-8 w-full gap-1 text-xs text-muted-foreground hover:text-foreground"
					onclick={() => goto(viewAllHref)}
				>
					مشاهده همه نوبت‌ها
					<ArrowLeft class="h-3.5 w-3.5" />
				</Button>
			</div>
		{/if}
	{/if}
</section>
