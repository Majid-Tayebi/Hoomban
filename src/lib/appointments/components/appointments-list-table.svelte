<script lang="ts">
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import { getUser } from '$lib/auth.svelte';
	import { canNavigateToPatientFromAppointment, canAccessSecretaryPatientDesk, getPatientRecordHref } from '$lib/rbac';
	import type { AppointmentListItem } from '../types';
	import {
		cancelAppointment,
		canCancelAppointmentStatus,
		canManageAppointmentActions,
		canPatientCancelAppointment,
		canPatientEditAppointment,
		canRescheduleAppointmentStatus
	} from '../services/appointment-actions';
	import { canPatientCancelByTime } from '../cancellation-policy';
	import {
		isAppointmentInRange,
		type AppointmentRangeFilter
	} from '../appointment-range-filter';
	import AppointmentCancelDialog from './appointment-cancel-dialog.svelte';
	import AppointmentRescheduleDialog from './appointment-reschedule-dialog.svelte';
	import AppointmentPatientEditDialog from './appointment-patient-edit-dialog.svelte';
	import AppointmentsDesktopTable from './appointments-desktop-table.svelte';
	import AppointmentsMobileList from './appointments-mobile-list.svelte';
	import SecretarySmsDialog from '$lib/desk/components/secretary-sms-dialog.svelte';
	import { formatFaDate, formatFaTime } from '$lib/date';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import TablePagination from '$lib/components/ui/table-pagination.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { Plus } from '@lucide/svelte';

	let {
		appointments,
		loading = false,
		pageSize = 10,
		focusAppointmentId = null,
		onChanged,
		onNewAppointment
	}: {
		appointments: AppointmentListItem[];
		loading?: boolean;
		pageSize?: number;
		focusAppointmentId?: string | null;
		onChanged?: () => void | Promise<void>;
		onNewAppointment?: () => void | Promise<void>;
	} = $props();

	let page = $state(1);
	let confirmOpen = $state(false);
	let rescheduleOpen = $state(false);
	let cancelTarget = $state<AppointmentListItem | null>(null);
	let rescheduleTarget = $state<AppointmentListItem | null>(null);
	let editOpen = $state(false);
	let editTarget = $state<AppointmentListItem | null>(null);
	let smsOpen = $state(false);
	let smsTarget = $state<AppointmentListItem | null>(null);
	let cancelling = $state(false);
	let actionError = $state('');
	let openMenuId = $state<string | null>(null);
	let highlightedId = $state<string | null>(null);
	let rangeFilter = $state<AppointmentRangeFilter>('week');
	let selectedIds = $state<string[]>([]);

	const user = $derived(getUser());
	const isPatientView = $derived(user?.role === 'patient');
	const clickablePatients = $derived(canNavigateToPatientFromAppointment(user?.role));
	const canManage = $derived(canManageAppointmentActions(user?.role));
	const canSendPatientSms = $derived(user?.role === 'admin' || user?.role === 'secretary');

	function canSmsRow(apt: AppointmentListItem): boolean {
		return Boolean(
			canSendPatientSms &&
				apt.phone &&
				apt.phone !== '—' &&
				apt.phone.replace(/\D/g, '').length >= 10
		);
	}

	function requestSms(apt: AppointmentListItem) {
		smsTarget = apt;
		smsOpen = true;
		openMenuId = null;
	}

	function openPatient(patientUserId: string) {
		if (!clickablePatients || !patientUserId || !user) return;
		goto(
			getPatientRecordHref(
				patientUserId,
				user.role,
				canAccessSecretaryPatientDesk(user.role) ? 'appointments' : undefined
			)
		);
	}

	function canEditRow(apt: AppointmentListItem): boolean {
		return canPatientEditAppointment(user?.role, apt.patientUserId, user?.id, apt.status);
	}

	function canPatientCancelRow(apt: AppointmentListItem): boolean {
		return canPatientCancelAppointment(
			user?.role,
			apt.patientUserId,
			user?.id,
			apt.status,
			apt.dateTime
		);
	}

	function showPatientCancelLateHint(apt: AppointmentListItem): boolean {
		return (
			isPatientView &&
			apt.patientUserId === user?.id &&
			canCancelAppointmentStatus(apt.status) &&
			!canPatientCancelByTime(apt.dateTime)
		);
	}

	function canCancelRow(apt: AppointmentListItem): boolean {
		return canManage && canCancelAppointmentStatus(apt.status);
	}

	function canRescheduleRow(apt: AppointmentListItem): boolean {
		return canManage && canRescheduleAppointmentStatus(apt.status);
	}

	function requestEdit(apt: AppointmentListItem, event?: Event) {
		event?.stopPropagation();
		openMenuId = null;
		editTarget = apt;
		editOpen = true;
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

	function dismissCancel() {
		confirmOpen = false;
		cancelTarget = null;
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

	const gridClass = $derived(
		isPatientView
			? 'grid-cols-[minmax(9.5rem,1.2fr)_11.5rem_6.5rem_2.25rem]'
			: 'grid-cols-[2.25rem_minmax(9.5rem,1.2fr)_11.5rem_minmax(8.5rem,1.05fr)_9.5rem_6.5rem_2.25rem]'
	);

	const filteredAppointments = $derived.by(() =>
		appointments.filter((apt) => isAppointmentInRange(apt.dateTime, rangeFilter))
	);

	const paginated = $derived.by(() => {
		const start = (page - 1) * pageSize;
		return filteredAppointments.slice(start, start + pageSize);
	});

	const allVisibleSelected = $derived(
		paginated.length > 0 && paginated.every((apt) => selectedIds.includes(apt.id))
	);

	const selectedCount = $derived(selectedIds.length);

	function toggleSelectAll(checked: boolean) {
		const pageIds = paginated.map((apt) => apt.id);
		if (checked) {
			selectedIds = [...new Set([...selectedIds, ...pageIds])];
			return;
		}
		selectedIds = selectedIds.filter((id) => !pageIds.includes(id));
	}

	function toggleRowSelection(id: string, checked: boolean) {
		if (checked) {
			if (!selectedIds.includes(id)) selectedIds = [...selectedIds, id];
			return;
		}
		selectedIds = selectedIds.filter((value) => value !== id);
	}

	function onSelectAllChange(event: Event) {
		toggleSelectAll((event.currentTarget as HTMLInputElement).checked);
	}

	function onRowSelectChange(id: string, event: Event) {
		toggleRowSelection(id, (event.currentTarget as HTMLInputElement).checked);
	}

	$effect(() => {
		rangeFilter;
		page = 1;
		selectedIds = [];
	});

	$effect(() => {
		const maxPage = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
		if (page > maxPage) page = maxPage;
	});

	$effect(() => {
		const targetId = focusAppointmentId;
		if (!targetId || loading || !filteredAppointments.length) return;

		const index = filteredAppointments.findIndex((a) => a.id === targetId);
		if (index < 0) return;

		page = Math.floor(index / pageSize) + 1;
		highlightedId = targetId;

		void tick().then(() => {
			document.getElementById(`apt-row-${targetId}`)?.scrollIntoView({
				behavior: 'smooth',
				block: 'center'
			});
		});

		const timer = setTimeout(() => {
			if (highlightedId === targetId) highlightedId = null;
		}, 5000);
		return () => clearTimeout(timer);
	});
</script>

<Card class="overflow-hidden rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4 sm:px-5">
		<div>
			<CardTitle class="text-sm font-semibold sm:text-base">
				{isPatientView ? 'نوبت‌های من' : 'نوبت‌ها'}
			</CardTitle>
			<p class="mt-0.5 text-xs text-muted-foreground">
				{loading
					? 'در حال بارگذاری...'
					: `${filteredAppointments.length.toLocaleString('fa-IR')} مورد`}
				{#if !loading && selectedCount > 0}
					· {selectedCount.toLocaleString('fa-IR')} انتخاب‌شده
				{/if}
			</p>
		</div>
		<div class="flex shrink-0 items-center gap-2">
			<select
				class="rounded-lg border border-input bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground sm:text-xs"
				aria-label="فیلتر بازه"
				bind:value={rangeFilter}
			>
				<option value="week">این هفته</option>
				<option value="month">این ماه</option>
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
		{#if !loading && filteredAppointments.length === 0}
			<p class="px-5 py-12 text-center text-sm text-muted-foreground">نوبتی در این بازه یافت نشد.</p>
		{:else}
			<AppointmentsDesktopTable
				appointments={paginated}
				{isPatientView}
				{gridClass}
				{selectedIds}
				{allVisibleSelected}
				{clickablePatients}
				{highlightedId}
				bind:openMenuId
				{onSelectAllChange}
				{onRowSelectChange}
				onOpenPatient={openPatient}
				{canEditRow}
				{canPatientCancelRow}
				{canRescheduleRow}
				{canCancelRow}
				{canSmsRow}
				onEdit={requestEdit}
				onCancel={requestCancel}
				onReschedule={requestReschedule}
				onSms={requestSms}
			/>

			<AppointmentsMobileList
				appointments={paginated}
				{isPatientView}
				{clickablePatients}
				{highlightedId}
				onOpenPatient={openPatient}
				{canEditRow}
				{canPatientCancelRow}
				{canRescheduleRow}
				{canCancelRow}
				{canSmsRow}
				{showPatientCancelLateHint}
				onEdit={requestEdit}
				onCancel={requestCancel}
				onReschedule={requestReschedule}
				onSms={requestSms}
			/>

			<TablePagination bind:page {pageSize} total={filteredAppointments.length} />
		{/if}
	</CardContent>
</Card>

<AppointmentCancelDialog
	bind:open={confirmOpen}
	appointment={cancelTarget}
	{isPatientView}
	{actionError}
	{cancelling}
	onConfirm={confirmCancel}
	onDismiss={dismissCancel}
/>

<AppointmentRescheduleDialog
	bind:open={rescheduleOpen}
	bind:appointment={rescheduleTarget}
	onSaved={onChanged}
/>

<AppointmentPatientEditDialog bind:open={editOpen} bind:appointment={editTarget} onSaved={onChanged} />

<SecretarySmsDialog
	bind:open={smsOpen}
	phone={smsTarget?.phone ?? ''}
	patientName={smsTarget?.patientName ?? ''}
	doctorName={smsTarget?.doctorName ?? ''}
	appointmentDate={smsTarget ? formatFaDate(smsTarget.dateTime) : ''}
	appointmentTime={smsTarget ? formatFaTime(smsTarget.dateTime) : ''}
/>
