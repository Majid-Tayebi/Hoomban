<script lang="ts">
	import type { AppointmentListItem } from '../types';
	import { PATIENT_CANCEL_TOO_LATE_MESSAGE } from '../cancellation-policy';
	import Button from '$lib/components/ui/button.svelte';
	import { DropdownMenu } from 'bits-ui';
	import { MoreHorizontal, XCircle, CalendarClock, Pencil, MessageSquareText } from '@lucide/svelte';

	let {
		appointment,
		variant,
		canEdit = false,
		canPatientCancel = false,
		canReschedule = false,
		canCancel = false,
		canSms = false,
		showLateHint = false,
		openMenuId = $bindable(null as string | null),
		onEdit,
		onCancel,
		onReschedule,
		onSms
	}: {
		appointment: AppointmentListItem;
		variant: 'desktop' | 'mobile';
		canEdit?: boolean;
		canPatientCancel?: boolean;
		canReschedule?: boolean;
		canCancel?: boolean;
		canSms?: boolean;
		showLateHint?: boolean;
		openMenuId?: string | null;
		onEdit: () => void;
		onCancel: () => void;
		onReschedule: () => void;
		onSms: () => void;
	} = $props();

	const menuItemClass =
		'flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-all duration-200 ease-in-out data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive';
	const menuItemRescheduleClass =
		'flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-all duration-200 ease-in-out data-[highlighted]:bg-muted data-[highlighted]:text-foreground';

	const showPatientActions = $derived(canEdit || canPatientCancel);
	const showStaffActions = $derived(canReschedule || canCancel || canSms);
</script>

{#if variant === 'desktop'}
	{#if showPatientActions}
		<div class="flex items-center gap-0.5">
			{#if canEdit}
				<Button variant="ghost" size="sm" class="h-8 rounded-lg px-2" onclick={onEdit}>
					<Pencil class="h-4 w-4" />
					<span class="sr-only">ویرایش</span>
				</Button>
			{/if}
			{#if canPatientCancel}
				<Button
					variant="ghost"
					size="sm"
					class="h-8 rounded-lg px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
					onclick={onCancel}
				>
					<XCircle class="h-4 w-4" />
					<span class="sr-only">لغو نوبت</span>
				</Button>
			{/if}
		</div>
	{:else if showStaffActions}
		<DropdownMenu.Root
			open={openMenuId === appointment.id}
			onOpenChange={(v) => {
				openMenuId = v ? appointment.id : null;
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
					{#if canReschedule}
						<DropdownMenu.Item class={menuItemRescheduleClass} onSelect={onReschedule}>
							<CalendarClock class="h-4 w-4" />
							تغییر زمان
						</DropdownMenu.Item>
					{/if}
					{#if canCancel}
						<DropdownMenu.Item class={menuItemClass} onSelect={onCancel}>
							<XCircle class="h-4 w-4" />
							لغو نوبت
						</DropdownMenu.Item>
					{/if}
					{#if canSms}
						<DropdownMenu.Item class={menuItemClass} onSelect={onSms}>
							<MessageSquareText class="h-4 w-4" />
							ارسال پیامک
						</DropdownMenu.Item>
					{/if}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	{:else}
		<span class="inline-block w-7" aria-hidden="true"></span>
	{/if}
{:else if showPatientActions || showLateHint}
	<div class="mt-3 space-y-2 border-t border-border/40 pt-3">
		{#if showPatientActions}
			<div class="flex gap-2">
				{#if canEdit}
					<Button variant="outline" size="sm" class="h-8 flex-1 rounded-lg" onclick={onEdit}>
						<Pencil class="ml-1.5 h-3.5 w-3.5" />
						ویرایش نوبت
					</Button>
				{/if}
				{#if canPatientCancel}
					<Button
						variant="outline"
						size="sm"
						class="h-8 flex-1 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
						onclick={onCancel}
					>
						<XCircle class="ml-1.5 h-3.5 w-3.5" />
						لغو نوبت
					</Button>
				{/if}
			</div>
		{/if}
		{#if showLateHint}
			<p class="text-[11px] leading-relaxed text-muted-foreground">
				{PATIENT_CANCEL_TOO_LATE_MESSAGE}
			</p>
		{/if}
	</div>
{:else if showStaffActions}
	<div class="mt-3 flex flex-wrap gap-2 border-t border-border/40 pt-3">
		{#if canReschedule}
			<Button variant="outline" size="sm" class="h-8 flex-1 rounded-lg" onclick={onReschedule}>
				<CalendarClock class="ml-1.5 h-3.5 w-3.5" />
				تغییر زمان
			</Button>
		{/if}
		{#if canCancel}
			<Button
				variant="outline"
				size="sm"
				class="h-8 flex-1 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
				onclick={onCancel}
			>
				<XCircle class="ml-1.5 h-3.5 w-3.5" />
				لغو
			</Button>
		{/if}
		{#if canSms}
			<Button variant="outline" size="sm" class="h-8 flex-1 rounded-lg" onclick={onSms}>
				<MessageSquareText class="ml-1.5 h-3.5 w-3.5" />
				پیامک
			</Button>
		{/if}
	</div>
{/if}
