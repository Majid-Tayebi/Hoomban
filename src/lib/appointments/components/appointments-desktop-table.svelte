<script lang="ts">
	import type { AppointmentListItem } from '../types';
	import { getStatusConfig } from '../services/appointments-data';
	import AppointmentRowActions from './appointment-row-actions.svelte';
	import { formatFaDate, formatFaTime } from '$lib/date';
	import Checkbox from '$lib/components/ui/checkbox.svelte';
	import { cn } from '$lib/utils';

	let {
		appointments,
		isPatientView,
		gridClass,
		selectedIds,
		allVisibleSelected,
		clickablePatients,
		highlightedId,
		openMenuId = $bindable(null as string | null),
		onSelectAllChange,
		onRowSelectChange,
		onOpenPatient,
		canEditRow,
		canPatientCancelRow,
		canRescheduleRow,
		canCancelRow,
		canSmsRow,
		onEdit,
		onCancel,
		onReschedule,
		onSms
	}: {
		appointments: AppointmentListItem[];
		isPatientView: boolean;
		gridClass: string;
		selectedIds: string[];
		allVisibleSelected: boolean;
		clickablePatients: boolean;
		highlightedId: string | null;
		openMenuId?: string | null;
		onSelectAllChange: (event: Event) => void;
		onRowSelectChange: (id: string, event: Event) => void;
		onOpenPatient: (patientUserId: string) => void;
		canEditRow: (apt: AppointmentListItem) => boolean;
		canPatientCancelRow: (apt: AppointmentListItem) => boolean;
		canRescheduleRow: (apt: AppointmentListItem) => boolean;
		canCancelRow: (apt: AppointmentListItem) => boolean;
		canSmsRow: (apt: AppointmentListItem) => boolean;
		onEdit: (apt: AppointmentListItem) => void;
		onCancel: (apt: AppointmentListItem) => void;
		onReschedule: (apt: AppointmentListItem) => void;
		onSms: (apt: AppointmentListItem) => void;
	} = $props();

	const phoneColumnClass = 'flex min-w-0 w-full justify-end pe-6 ps-4';
	const phoneCellClass = `${phoneColumnClass} truncate text-sm tabular-nums text-muted-foreground`;
	const patientCellClass = 'min-w-0 overflow-hidden';
	const specialistCellClass = 'min-w-0 overflow-hidden pe-6';

	function rowHighlightClass(id: string): string {
		return highlightedId === id
			? 'ring-2 ring-amber-400/70 bg-amber-50/60 dark:bg-amber-950/20'
			: '';
	}

	function formatPhone(phone: string): string {
		if (phone === '—') return phone;
		return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
	}

	function rowSelectHandler(id: string) {
		return (event: Event) => onRowSelectChange(id, event);
	}

	function stopRowNavigation(event: Event) {
		event.stopPropagation();
	}
</script>

<div class="hidden overflow-x-auto md:block">
	<div class={cn('min-w-[760px]', isPatientView && 'min-w-[520px]')}>
		<div
			class={cn(
				'grid items-center gap-x-10 border-y border-border/40 bg-muted/30 px-4 py-2.5 text-[11px] font-medium text-muted-foreground sm:px-5',
				gridClass
			)}
		>
			{#if !isPatientView}
				<span class="flex justify-center">
					<Checkbox
						checked={allVisibleSelected}
						aria-label="انتخاب همه نوبت‌های این صفحه"
						onchange={onSelectAllChange}
					/>
				</span>
				<span class="min-w-0">مراجع</span>
				<bdi class={phoneColumnClass} dir="ltr">تماس</bdi>
			{/if}
			<span class={specialistCellClass}>متخصص</span>
			<span class="min-w-0">زمان</span>
			<span class="min-w-0 text-center">وضعیت</span>
			<span class="sr-only">عملیات</span>
		</div>

		<ul class="divide-y divide-border/40">
			{#each appointments as apt (apt.id)}
				{@const status = getStatusConfig(apt.status)}
				<li
					id={`apt-row-${apt.id}`}
					class={cn(
						'grid items-center gap-x-10 px-4 py-3 transition-all duration-300 sm:px-5',
						gridClass,
						rowHighlightClass(apt.id),
						!isPatientView && clickablePatients && apt.patientUserId
							? 'cursor-pointer hover:bg-muted/30'
							: ''
					)}
					role={!isPatientView && clickablePatients && apt.patientUserId ? 'button' : undefined}
					onclick={() => !isPatientView && onOpenPatient(apt.patientUserId)}
					onkeydown={(e) => {
						if (!isPatientView && (e.key === 'Enter' || e.key === ' ') && apt.patientUserId) {
							e.preventDefault();
							onOpenPatient(apt.patientUserId);
						}
					}}
				>
					{#if !isPatientView}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="flex justify-center" onclick={stopRowNavigation}>
							<Checkbox
								checked={selectedIds.includes(apt.id)}
								aria-label={`انتخاب نوبت ${apt.patientName}`}
								onchange={rowSelectHandler(apt.id)}
							/>
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
					{/if}

					<div class={specialistCellClass}>
						<p class="truncate text-sm font-medium leading-snug">{apt.doctorName}</p>
						<p class="mt-0.5 truncate text-[11px] leading-snug text-muted-foreground">
							{apt.specialty}
						</p>
					</div>

					<div class="min-w-0 overflow-hidden text-sm tabular-nums leading-snug text-muted-foreground">
						<p class="truncate">{formatFaDate(apt.dateTime)}</p>
						<p class="mt-0.5 truncate text-[11px]">{formatFaTime(apt.dateTime)}</p>
					</div>

					<div class="flex min-w-0 justify-center">
						<span class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium {status.class}">
							{status.label}
						</span>
					</div>

					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="flex justify-center" onclick={stopRowNavigation}>
						<AppointmentRowActions
							appointment={apt}
							variant="desktop"
							bind:openMenuId
							canEdit={canEditRow(apt)}
							canPatientCancel={canPatientCancelRow(apt)}
							canReschedule={canRescheduleRow(apt)}
							canCancel={canCancelRow(apt)}
							canSms={canSmsRow(apt)}
							onEdit={() => onEdit(apt)}
							onCancel={() => onCancel(apt)}
							onReschedule={() => onReschedule(apt)}
							onSms={() => onSms(apt)}
						/>
					</div>
				</li>
			{/each}
		</ul>
	</div>
</div>
