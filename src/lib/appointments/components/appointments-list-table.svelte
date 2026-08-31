<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { canNavigateToPatientFromAppointment, getPatientRecordHref } from '$lib/rbac';
	import type { AppointmentListItem } from '../types';
	import { getStatusConfig } from '../services/appointments-data';
	import {
		cancelAppointment,
		canCancelAppointmentStatus,
		canRescheduleAppointmentStatus,
		canManageAppointmentActions
	} from '../services/appointment-actions';
	import AppointmentRescheduleDialog from './appointment-reschedule-dialog.svelte';
	import { formatFaDate, formatFaTime } from '$lib/date';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Checkbox from '$lib/components/ui/checkbox.svelte';
	import TablePagination from '$lib/components/ui/table-pagination.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import { DropdownMenu } from 'bits-ui';
	import { LoaderCircle, MoreHorizontal, Plus, XCircle, CalendarClock } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let {
		appointments,
		loading = false,
		pageSize = 10,
		onChanged,
		onNewAppointment
	}: {
		appointments: AppointmentListItem[];
		loading?: boolean;
		pageSize?: number;
		onChanged?: () => void | Promise<void>;
		onNewAppointment?: () => void | Promise<void>;
	} = $props();

	let page = $state(1);
	let confirmOpen = $state(false);
	let rescheduleOpen = $state(false);
	let cancelTarget = $state<AppointmentListItem | null>(null);
	let rescheduleTarget = $state<AppointmentListItem | null>(null);
	let cancelling = $state(false);
	let actionError = $state('');
	let openMenuId = $state<string | null>(null);

	const user = $derived(getUser());
	const clickablePatients = $derived(canNavigateToPatientFromAppointment(user?.role));
	const canManage = $derived(canManageAppointmentActions(user?.role));

	function openPatient(patientUserId: string) {
		if (!clickablePatients || !patientUserId || !user) return;
		goto(getPatientRecordHref(patientUserId, user.role));
	}

	function canCancelRow(apt: AppointmentListItem): boolean {
		return canManage && canCancelAppointmentStatus(apt.status);
	}

	function canRescheduleRow(apt: AppointmentListItem): boolean {
		return canManage && canRescheduleAppointmentStatus(apt.status);
	}

	function requestReschedule(apt: AppointmentListItem, event?: Event) {
		event?.stopPropagation();
		openMenuId = null;
		rescheduleTarget = apt;
		rescheduleOpen = true;
	}

	function requestCancel(apt: AppointmentListItem, event?: Event) {
		event?.stopPropagation();
		openMenuId = null;
		cancelTarget = apt;
		actionError = '';
		confirmOpen = true;
	}

	async function confirmCancel() {
		if (!cancelTarget) return;
		cancelling = true;
		actionError = '';
		try {
			await cancelAppointment(cancelTarget.id);
			confirmOpen = false;
			cancelTarget = null;
			await onChanged?.();
		} catch (err: unknown) {
			actionError = err instanceof Error ? err.message : 'لغو ناموفق بود';
		} finally {
			cancelling = false;
		}
	}

	const gridClass =
		'grid-cols-[2.25rem_minmax(9.5rem,1.2fr)_11.5rem_minmax(8.5rem,1.05fr)_9.5rem_6.5rem_2.25rem]';

	const phoneColumnClass = 'flex min-w-0 w-full justify-end pe-6 ps-4';
	const phoneCellClass = `${phoneColumnClass} truncate text-sm tabular-nums text-muted-foreground`;
	const patientCellClass = 'min-w-0 overflow-hidden';
	const specialistCellClass = 'min-w-0 overflow-hidden pe-6';

	const paginated = $derived.by(() => {
		const start = (page - 1) * pageSize;
		return appointments.slice(start, start + pageSize);
	});

	$effect(() => {
		const maxPage = Math.max(1, Math.ceil(appointments.length / pageSize));
		if (page > maxPage) page = maxPage;
	});

	function formatPhone(phone: string): string {
		if (phone === '—') return phone;
		return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
	}

	const menuItemClass =
		'flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-all duration-200 ease-in-out data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive';
	const menuItemRescheduleClass =
		'flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-all duration-200 ease-in-out data-[highlighted]:bg-muted data-[highlighted]:text-foreground';
</script>

<Card class="overflow-hidden rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4 sm:px-5">
		<div>
			<CardTitle class="text-sm font-semibold sm:text-base">نوبت‌ها</CardTitle>
			<p class="mt-0.5 text-xs text-muted-foreground">
				{loading ? 'در حال بارگذاری...' : `${appointments.length.toLocaleString('fa-IR')} مورد`}
			</p>
		</div>
		<div class="flex shrink-0 items-center gap-2">
			<select
				class="rounded-lg border border-input bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground sm:text-xs"
				aria-label="فیلتر بازه"
			>
				<option>این هفته</option>
				<option>این ماه</option>
			</select>
			{#if onNewAppointment}
				<Button size="sm" class="h-9 gap-1.5 rounded-lg px-3" onclick={onNewAppointment}>
					<Plus class="h-4 w-4" />
					<span class="hidden sm:inline">نوبت جدید</span>
					<span class="sm:hidden">جدید</span>
				</Button>
			{/if}
		</div>
	</CardHeader>

	<CardContent class="px-0 pb-0">
		{#if !loading && appointments.length === 0}
			<p class="px-5 py-12 text-center text-sm text-muted-foreground">نوبتی یافت نشد.</p>
		{:else}
			<div class="hidden overflow-x-auto md:block">
				<div class="min-w-[760px]">
					<div
						class={cn(
							'grid items-center gap-x-10 border-y border-border/40 bg-muted/30 px-4 py-2.5 text-[11px] font-medium text-muted-foreground sm:px-5',
							gridClass
						)}
					>
						<span class="flex justify-center"><Checkbox /></span>
						<span class="min-w-0">مراجع</span>
						<bdi class={phoneColumnClass} dir="ltr">تماس</bdi>
						<span class={specialistCellClass}>متخصص</span>
						<span class="min-w-0">زمان</span>
						<span class="min-w-0 text-center">وضعیت</span>
						<span class="sr-only">عملیات</span>
					</div>

					<ul class="divide-y divide-border/40">
						{#each paginated as apt (apt.id)}
							{@const status = getStatusConfig(apt.status)}
							<li
								class={cn(
									'grid items-center gap-x-10 px-4 py-3 sm:px-5',
									gridClass,
									clickablePatients && apt.patientUserId
										? 'cursor-pointer transition-colors duration-200 hover:bg-muted/30'
										: ''
								)}
								role={clickablePatients && apt.patientUserId ? 'button' : undefined}
								onclick={() => openPatient(apt.patientUserId)}
								onkeydown={(e) => {
									if ((e.key === 'Enter' || e.key === ' ') && apt.patientUserId) {
										e.preventDefault();
										openPatient(apt.patientUserId);
									}
								}}
							>
								<div class="flex justify-center" onclick={(e) => e.stopPropagation()}>
									<Checkbox />
								</div>

								<div class={patientCellClass}>
									<p class="truncate text-sm font-medium leading-snug">{apt.patientName}</p>
									<bdi
										class="mt-0.5 block w-full truncate text-end text-[11px] leading-snug tabular-nums text-muted-foreground"
										dir="ltr"
									>
										{apt.patientId}
									</bdi>
								</div>

								<bdi class={phoneCellClass} dir="ltr">
									{formatPhone(apt.phone)}
								</bdi>

								<div class={specialistCellClass}>
									<p class="truncate text-sm font-medium leading-snug">{apt.doctorName}</p>
									<p class="mt-0.5 truncate text-[11px] leading-snug text-muted-foreground">
										{apt.specialty}
									</p>
								</div>

								<div
									class="min-w-0 overflow-hidden text-sm tabular-nums leading-snug text-muted-foreground"
								>
									<p class="truncate">{formatFaDate(apt.dateTime)}</p>
									<p class="mt-0.5 truncate text-[11px]">{formatFaTime(apt.dateTime)}</p>
								</div>

								<div class="flex min-w-0 justify-center">
									<span
										class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium {status.class}"
									>
										{status.label}
									</span>
								</div>

								<div class="flex justify-center" onclick={(e) => e.stopPropagation()}>
									{#if canRescheduleRow(apt) || canCancelRow(apt)}
										<DropdownMenu.Root
											open={openMenuId === apt.id}
											onOpenChange={(v) => {
												openMenuId = v ? apt.id : null;
											}}
										>
											<DropdownMenu.Trigger
												class="rounded-lg p-1.5 transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
												aria-label="عملیات نوبت"
											>
												<MoreHorizontal class="h-4 w-4 text-muted-foreground" />
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content
													align="end"
													sideOffset={6}
													class="z-50 min-w-[10rem] overflow-hidden rounded-xl border border-border/70 bg-popover p-1 text-popover-foreground shadow-lg"
												>
													{#if canRescheduleRow(apt)}
														<DropdownMenu.Item
															class={menuItemRescheduleClass}
															onSelect={() => requestReschedule(apt)}
														>
															<CalendarClock class="h-4 w-4" />
															تغییر زمان
														</DropdownMenu.Item>
													{/if}
													{#if canCancelRow(apt)}
														<DropdownMenu.Item
															class={menuItemClass}
															onSelect={() => requestCancel(apt)}
														>
															<XCircle class="h-4 w-4" />
															لغو نوبت
														</DropdownMenu.Item>
													{/if}
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									{:else}
										<span class="inline-block w-7" aria-hidden="true"></span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<div class="space-y-2 p-3 md:hidden">
				{#each paginated as apt (apt.id)}
					{@const status = getStatusConfig(apt.status)}
					<div class="rounded-xl border border-border/50 bg-card p-3">
						<div
							class={cn(
								clickablePatients && apt.patientUserId
									? 'cursor-pointer transition-colors duration-200 hover:opacity-90'
									: ''
							)}
							role={clickablePatients && apt.patientUserId ? 'button' : undefined}
							onclick={() => openPatient(apt.patientUserId)}
							onkeydown={(e) => {
								if ((e.key === 'Enter' || e.key === ' ') && apt.patientUserId) {
									e.preventDefault();
									openPatient(apt.patientUserId);
								}
							}}
						>
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0 overflow-hidden">
									<p class="truncate text-sm font-medium">{apt.patientName}</p>
									<bdi
										class="mt-0.5 block w-full truncate text-end text-[11px] tabular-nums text-muted-foreground"
										dir="ltr"
									>
										{apt.patientId}
									</bdi>
									<bdi
										class="mt-0.5 block w-full truncate text-end text-[11px] tabular-nums text-muted-foreground"
										dir="ltr"
									>
										{formatPhone(apt.phone)}
									</bdi>
								</div>
								<span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium {status.class}">
									{status.label}
								</span>
							</div>
							<div class="mt-2 space-y-0.5 text-xs text-muted-foreground">
								<p>{apt.doctorName} — {apt.specialty}</p>
								<p class="tabular-nums">
									{formatFaDate(apt.dateTime)} · {formatFaTime(apt.dateTime)}
								</p>
							</div>
						</div>
						{#if canRescheduleRow(apt) || canCancelRow(apt)}
							<div class="mt-3 flex gap-2 border-t border-border/40 pt-3">
								{#if canRescheduleRow(apt)}
									<Button
										variant="outline"
										size="sm"
										class="h-8 flex-1 rounded-lg"
										onclick={() => requestReschedule(apt)}
									>
										<CalendarClock class="ml-1.5 h-3.5 w-3.5" />
										تغییر زمان
									</Button>
								{/if}
								{#if canCancelRow(apt)}
									<Button
										variant="outline"
										size="sm"
										class="h-8 flex-1 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
										onclick={() => requestCancel(apt)}
									>
										<XCircle class="ml-1.5 h-3.5 w-3.5" />
										لغو
									</Button>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<TablePagination bind:page {pageSize} total={appointments.length} />
		{/if}
	</CardContent>
</Card>

<Dialog bind:open={confirmOpen} class="max-w-sm">
	<div class="space-y-4 text-right">
		<div>
			<h3 class="text-base font-semibold">لغو نوبت</h3>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				{#if cancelTarget}
					آیا از لغو نوبت
					<strong class="text-foreground">{cancelTarget.patientName}</strong>
					در
					<span class="tabular-nums">{formatFaDate(cancelTarget.dateTime)}</span>
					اطمینان دارید؟
				{/if}
			</p>
		</div>
		{#if actionError}
			<p class="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>
		{/if}
		<div class="flex flex-wrap justify-end gap-2">
			<Button
				variant="ghost"
				size="sm"
				class="rounded-xl"
				disabled={cancelling}
				onclick={() => {
					confirmOpen = false;
					cancelTarget = null;
				}}
			>
				انصراف
			</Button>
			<Button
				variant="destructive"
				size="sm"
				class="rounded-xl"
				disabled={cancelling}
				onclick={confirmCancel}
			>
				{#if cancelling}
					<LoaderCircle class="ml-1.5 h-4 w-4 animate-spin" />
				{/if}
				لغو نوبت
			</Button>
		</div>
	</div>
</Dialog>

<AppointmentRescheduleDialog
	bind:open={rescheduleOpen}
	bind:appointment={rescheduleTarget}
	onSaved={onChanged}
/>
