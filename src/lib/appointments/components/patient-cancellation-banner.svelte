<script lang="ts">
	import type { AppointmentListItem } from '../types';
	import { canCancelAppointmentStatus } from '../services/appointment-actions';
	import { canPatientCancelByTime } from '../cancellation-policy';
	import { formatFaDate, formatFaTime } from '$lib/date';
	import Button from '$lib/components/ui/button.svelte';
	import { AlertTriangle, CheckCircle2, Phone, Ticket } from '@lucide/svelte';

	let {
		appointments,
		focusAppointmentId = null,
		onRequestSupport
	}: {
		appointments: AppointmentListItem[];
		focusAppointmentId?: string | null;
		onRequestSupport?: (appointmentId?: string) => void;
	} = $props();

	const target = $derived.by(() => {
		if (focusAppointmentId) {
			const focused = appointments.find((a) => a.id === focusAppointmentId);
			if (focused && canCancelAppointmentStatus(focused.status)) return focused;
		}
		const now = Date.now();
		return (
			appointments
				.filter(
					(a) =>
						canCancelAppointmentStatus(a.status) && new Date(a.dateTime).getTime() > now
				)
				.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0] ??
			null
		);
	});

	const canFreeCancel = $derived(target ? canPatientCancelByTime(target.dateTime) : null);
</script>

<div
	class="overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-br from-amber-50 via-orange-50/80 to-amber-100/40 shadow-sm dark:border-amber-700/40 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-amber-900/10"
>
	<div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300"
		>
			{#if canFreeCancel}
				<CheckCircle2 class="h-5 w-5" />
			{:else}
				<AlertTriangle class="h-5 w-5" />
			{/if}
		</div>

		<div class="min-w-0 flex-1 space-y-2 text-right">
			<h2 class="text-sm font-semibold text-amber-950 dark:text-amber-100">قوانین لغو نوبت</h2>

			{#if target}
				<p class="text-sm leading-relaxed text-amber-950/85 dark:text-amber-50/90">
					{#if canFreeCancel}
						برای نوبت
						<span class="font-medium tabular-nums">{formatFaDate(target.dateTime)}</span>
						ساعت
						<span class="font-medium tabular-nums">{formatFaTime(target.dateTime)}</span>
						می‌توانید تا ۲۴ ساعت قبل از زمان نوبت، <strong>بدون کسر هزینه</strong> رزرو خود را
						لغو کنید.
					{:else}
						برای نوبت
						<span class="font-medium tabular-nums">{formatFaDate(target.dateTime)}</span>
						ساعت
						<span class="font-medium tabular-nums">{formatFaTime(target.dateTime)}</span>
						کمتر از ۲۴ ساعت مانده است؛ برای لغو باید با منشی کلینیک تماس بگیرید یا درخواست ثبت
						کنید.
					{/if}
				</p>
			{:else}
				<p class="text-sm leading-relaxed text-amber-950/85 dark:text-amber-50/90">
					اگر بیش از ۲۴ ساعت به نوبت شما مانده باشد، می‌توانید بدون کسر هزینه رزرو را لغو کنید.
					در غیر این صورت با منشی کلینیک تماس بگیرید یا درخواست ثبت کنید.
				</p>
			{/if}

			{#if canFreeCancel === false}
				<div class="flex flex-wrap items-center gap-2 pt-1">
					<a
						href="tel:02155502035"
						class="inline-flex h-8 items-center justify-center rounded-lg border border-amber-400/50 bg-white/70 px-3 text-xs font-medium text-amber-950 transition-all duration-200 hover:bg-white dark:bg-amber-950/30 dark:text-amber-100"
					>
						<Phone class="ml-1.5 h-3.5 w-3.5" />
						تماس با منشی
					</a>
					{#if onRequestSupport}
						<Button
							variant="outline"
							size="sm"
							class="h-8 rounded-lg border-amber-500/40 bg-amber-500/10 text-amber-950 hover:bg-amber-500/15 dark:text-amber-100"
							onclick={() => onRequestSupport(target?.id)}
						>
							<Ticket class="ml-1.5 h-3.5 w-3.5" />
							ثبت درخواست
						</Button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
