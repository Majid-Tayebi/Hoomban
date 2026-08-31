<script lang="ts">
	import type { PatientAppointmentRow } from '../types';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Table from '$lib/components/ui/table.svelte';
	import TableHeader from '$lib/components/ui/table-header.svelte';
	import TableBody from '$lib/components/ui/table-body.svelte';
	import TableRow from '$lib/components/ui/table-row.svelte';
	import TableHead from '$lib/components/ui/table-head.svelte';
	import TableCell from '$lib/components/ui/table-cell.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import { cn } from '$lib/utils';
	import { Calendar, CalendarClock, Clock, MapPin, Stethoscope, Video } from '@lucide/svelte';

	let { appointments }: { appointments: PatientAppointmentRow[] } = $props();

	let tab = $state<'all' | 'upcoming' | 'history'>('all');
	const now = Date.now();

	const filtered = $derived.by(() => {
		if (tab === 'upcoming') return appointments.filter((a) => a.dateTime.getTime() >= now);
		if (tab === 'history') return appointments.filter((a) => a.dateTime.getTime() < now);
		return appointments;
	});

	const tabs = [
		{ id: 'all' as const, label: 'همه' },
		{ id: 'upcoming' as const, label: 'آتی' },
		{ id: 'history' as const, label: 'تاریخچه' }
	];

	function formatDate(d: Date): string {
		return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (status.includes('لغو')) return 'destructive';
		if (status.includes('تأیید') || status.includes('تکمیل')) return 'default';
		if (status.includes('انتظار') || status.includes('رزرو')) return 'secondary';
		return 'outline';
	}

	function statusBadgeClass(status: string): string {
		if (status.includes('لغو')) return 'border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/10';
		if (status.includes('تأیید') || status.includes('تکمیل')) {
			return 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/10';
		}
		if (status.includes('انتظار') || status.includes('رزرو')) {
			return 'border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400';
		}
		return 'border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted/50';
	}

	function typeIcon(type: string) {
		if (type === 'آنلاین') return Video;
		if (type === 'خدمت') return Stethoscope;
		return MapPin;
	}
</script>

<Card class="overflow-hidden rounded-2xl border-border/60 shadow-sm">
	<CardHeader
		class="flex-row flex-wrap items-center justify-between gap-2 space-y-0 border-b border-border/40 px-3 pb-3 pt-3 sm:px-4"
	>
		<div class="flex items-center gap-2.5">
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
			>
				<CalendarClock class="h-4 w-4" />
			</div>
			<div>
				<CardTitle class="text-sm font-semibold">نوبت‌ها</CardTitle>
				<p class="text-[11px] text-muted-foreground">
					{filtered.length.toLocaleString('fa-IR')} نوبت
					{#if tab === 'upcoming'}
						· آتی
					{:else if tab === 'history'}
						· گذشته
					{/if}
				</p>
			</div>
		</div>

		<div class="inline-flex rounded-xl bg-muted/60 p-1">
			{#each tabs as t (t.id)}
				<button
					type="button"
					class={cn(
						'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ease-in-out',
						tab === t.id
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'
					)}
					onclick={() => (tab = t.id)}
				>
					{t.label}
				</button>
			{/each}
		</div>
	</CardHeader>

	<CardContent class="px-0 pb-0">
		{#if filtered.length === 0}
			<div class="flex flex-col items-center justify-center px-4 py-8 text-center">
				<div
					class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground"
				>
					<Calendar class="h-5 w-5" />
				</div>
				<p class="text-sm font-medium text-foreground">نوبتی یافت نشد</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{#if tab === 'upcoming'}
						نوبت آتی برای این مراجع ثبت نشده است.
					{:else if tab === 'history'}
						سابقه نوبتی برای این مراجع وجود ندارد.
					{:else}
						هنوز نوبتی برای این مراجع ثبت نشده است.
					{/if}
				</p>
			</div>
		{:else}
			<div class="hidden sm:block">
				<Table>
					<TableHeader>
						<TableRow class="border-border/40 bg-muted/20 hover:bg-muted/20">
							<TableHead class="w-[22%] min-w-[8.5rem] text-right text-[11px] font-medium">
								تاریخ
							</TableHead>
							<TableHead class="w-[14%] min-w-[6.5rem] text-right text-[11px] font-medium">
								ساعت
							</TableHead>
							<TableHead class="w-[12%] min-w-[5rem] text-right text-[11px] font-medium">
								نوع
							</TableHead>
							<TableHead class="text-right text-[11px] font-medium">متخصص / خدمت</TableHead>
							<TableHead class="w-[7.5rem] text-right text-[11px] font-medium">وضعیت</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filtered as apt (apt.id)}
							{@const TypeIcon = typeIcon(apt.type)}
							<TableRow class="border-border/30 transition-colors duration-200 hover:bg-muted/30">
								<TableCell class="py-2.5 text-sm font-medium">
									<span class="block truncate">{formatDate(apt.dateTime)}</span>
								</TableCell>
								<TableCell class="py-2.5 text-sm tabular-nums text-muted-foreground">
									<span class="block truncate text-right" dir="ltr">{apt.timeRange}</span>
								</TableCell>
								<TableCell class="py-2.5">
									<span
										class="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
									>
										<TypeIcon class="h-3.5 w-3.5 shrink-0 text-primary/70" />
										<span class="truncate">{apt.type}</span>
									</span>
								</TableCell>
								<TableCell class="py-2.5 text-sm">
									<span class="block truncate">{apt.displayName}</span>
								</TableCell>
								<TableCell class="py-2.5">
									<Badge variant={statusVariant(apt.status)} class={statusBadgeClass(apt.status)}>
										{apt.status}
									</Badge>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>

			<div class="divide-y divide-border/40 sm:hidden">
				{#each filtered as apt (apt.id)}
					{@const TypeIcon = typeIcon(apt.type)}
					<div class="space-y-2 px-3 py-3">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 space-y-1">
								<p class="text-sm font-semibold">{formatDate(apt.dateTime)}</p>
								<p class="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
									<Clock class="h-3.5 w-3.5 shrink-0" />
									<span dir="ltr">{apt.timeRange}</span>
								</p>
							</div>
							<Badge variant={statusVariant(apt.status)} class={statusBadgeClass(apt.status)}>
								{apt.status}
							</Badge>
						</div>
						<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
							<span class="inline-flex items-center gap-1.5">
								<TypeIcon class="h-3.5 w-3.5 shrink-0 text-primary/70" />
								{apt.type}
							</span>
							<span class="text-border">·</span>
							<span class="truncate">{apt.displayName}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>
