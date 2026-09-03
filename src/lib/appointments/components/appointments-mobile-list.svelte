<script lang="ts">
	import type { AppointmentListItem } from '../types';
	import { getStatusConfig } from '../services/appointments-data';
	import AppointmentRowActions from './appointment-row-actions.svelte';
	import { formatFaDate, formatFaTime } from '$lib/date';
	import { cn } from '$lib/utils';

	let {
		appointments,
		isPatientView,
		clickablePatients,
		highlightedId,
		onOpenPatient,
		canEditRow,
		canPatientCancelRow,
		canRescheduleRow,
		canCancelRow,
		canSmsRow,
		showPatientCancelLateHint,
		onEdit,
		onCancel,
		onReschedule,
		onSms
	}: {
		appointments: AppointmentListItem[];
		isPatientView: boolean;
		clickablePatients: boolean;
		highlightedId: string | null;
		onOpenPatient: (patientUserId: string) => void;
		canEditRow: (apt: AppointmentListItem) => boolean;
		canPatientCancelRow: (apt: AppointmentListItem) => boolean;
		canRescheduleRow: (apt: AppointmentListItem) => boolean;
		canCancelRow: (apt: AppointmentListItem) => boolean;
		canSmsRow: (apt: AppointmentListItem) => boolean;
		showPatientCancelLateHint: (apt: AppointmentListItem) => boolean;
		onEdit: (apt: AppointmentListItem) => void;
		onCancel: (apt: AppointmentListItem) => void;
		onReschedule: (apt: AppointmentListItem) => void;
		onSms: (apt: AppointmentListItem) => void;
	} = $props();

	function rowHighlightClass(id: string): string {
		return highlightedId === id
			? 'ring-2 ring-amber-400/70 bg-amber-50/60 dark:bg-amber-950/20'
			: '';
	}

	function formatPhone(phone: string): string {
		if (phone === '—') return phone;
		return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
	}
</script>

<div class="space-y-2 p-3 md:hidden">
	{#each appointments as apt (apt.id)}
		{@const status = getStatusConfig(apt.status)}
		<div
			id={`apt-row-${apt.id}`}
			class={cn(
				'rounded-xl border border-border/50 bg-card p-3 transition-all duration-300',
				rowHighlightClass(apt.id)
			)}
		>
			<div
				class={cn(
					!isPatientView && clickablePatients && apt.patientUserId
						? 'cursor-pointer transition-colors duration-200 hover:opacity-90'
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
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0 overflow-hidden">
						{#if isPatientView}
							<p class="truncate text-sm font-medium">{apt.doctorName}</p>
							<p class="mt-0.5 truncate text-xs text-muted-foreground">{apt.specialty}</p>
						{:else}
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
						{/if}
					</div>
					<span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium {status.class}">
						{status.label}
					</span>
				</div>
				<div class="mt-2 space-y-0.5 text-xs text-muted-foreground">
					{#if !isPatientView}
						<p>{apt.doctorName} — {apt.specialty}</p>
					{/if}
					<p class="tabular-nums">
						{formatFaDate(apt.dateTime)} · {formatFaTime(apt.dateTime)}
					</p>
				</div>
			</div>
			<AppointmentRowActions
				appointment={apt}
				variant="mobile"
				canEdit={canEditRow(apt)}
				canPatientCancel={canPatientCancelRow(apt)}
				canReschedule={canRescheduleRow(apt)}
				canCancel={canCancelRow(apt)}
				canSms={canSmsRow(apt)}
				showLateHint={showPatientCancelLateHint(apt)}
				onEdit={() => onEdit(apt)}
				onCancel={() => onCancel(apt)}
				onReschedule={() => onReschedule(apt)}
				onSms={() => onSms(apt)}
			/>
		</div>
	{/each}
</div>
