<script lang="ts">
	import type { AppointmentListItem } from '../types';
	import { PATIENT_CANCEL_REFUND_NOTE } from '../cancellation-policy';
	import { formatFaDate, formatFaTime } from '$lib/date';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { LoaderCircle } from '@lucide/svelte';

	let {
		open = $bindable(false),
		appointment = null,
		isPatientView = false,
		actionError = '',
		cancelling = false,
		onConfirm,
		onDismiss
	}: {
		open?: boolean;
		appointment?: AppointmentListItem | null;
		isPatientView?: boolean;
		actionError?: string;
		cancelling?: boolean;
		onConfirm: () => void | Promise<void>;
		onDismiss: () => void;
	} = $props();
</script>

<Dialog bind:open class="max-w-sm">
	<div class="space-y-4 text-right">
		<div>
			<h3 class="text-base font-semibold">لغو نوبت</h3>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				{#if appointment}
					{#if isPatientView}
						آیا از لغو نوبت خود در
						<span class="tabular-nums">{formatFaDate(appointment.dateTime)}</span>
						ساعت
						<span class="tabular-nums">{formatFaTime(appointment.dateTime)}</span>
						اطمینان دارید؟
						<span class="mt-2 block text-xs">{PATIENT_CANCEL_REFUND_NOTE}</span>
					{:else}
						آیا از لغو نوبت
						<strong class="text-foreground">{appointment.patientName}</strong>
						در
						<span class="tabular-nums">{formatFaDate(appointment.dateTime)}</span>
						اطمینان دارید؟
					{/if}
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
				onclick={onDismiss}
			>
				انصراف
			</Button>
			<Button
				variant="destructive"
				size="sm"
				class="rounded-xl"
				disabled={cancelling}
				onclick={onConfirm}
			>
				{#if cancelling}
					<LoaderCircle class="ml-1.5 h-4 w-4 animate-spin" />
				{/if}
				لغو نوبت
			</Button>
		</div>
	</div>
</Dialog>
