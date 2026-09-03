<script lang="ts">
	import type { BookingDoctor, BookingService, BookingSlot } from '../booking-types';
	import { formatFaDate } from '$lib/date';
	import { formatToman } from '$lib/money';
	import { CreditCard } from '@lucide/svelte';
	import type { ZarinpalGatewayStatus } from '$lib/payments/zarinpal-client';

	let {
		clientLabel,
		clientMobile = '',
		deskMode = false,
		selectedDoctor = null as BookingDoctor | null,
		selectedService = null as BookingService | null,
		isServiceBooking = false,
		selectedDate,
		selectedSlot = null as BookingSlot | null,
		bookingAmountToman = 0,
		shouldPayOnline = false,
		gatewayStatus = null as ZarinpalGatewayStatus | null
	}: {
		clientLabel: string;
		clientMobile?: string;
		deskMode?: boolean;
		selectedDoctor?: BookingDoctor | null;
		selectedService?: BookingService | null;
		isServiceBooking?: boolean;
		selectedDate: Date;
		selectedSlot?: BookingSlot | null;
		bookingAmountToman?: number;
		shouldPayOnline?: boolean;
		gatewayStatus?: ZarinpalGatewayStatus | null;
	} = $props();
</script>

<div class="space-y-3">
	<div class="rounded-xl border border-border/60 p-3.5">
		<p class="text-xs text-muted-foreground">مراجع</p>
		<p class="mt-0.5 text-sm font-medium">{clientLabel}</p>
		{#if deskMode}
			<p class="mt-0.5 text-xs text-muted-foreground" dir="ltr">{clientMobile}</p>
		{/if}
	</div>
	{#if isServiceBooking && selectedService}
		<div class="rounded-xl border border-border/60 p-3.5">
			<p class="text-xs text-muted-foreground">خدمت</p>
			<p class="mt-0.5 text-sm font-medium">{selectedService.title}</p>
			{#if selectedService.category}
				<p class="text-xs text-muted-foreground">{selectedService.category}</p>
			{/if}
			{#if selectedService.price > 0}
				<p class="mt-1 text-xs tabular-nums text-muted-foreground">
					{formatToman(selectedService.price)}
				</p>
			{/if}
		</div>
	{:else if selectedDoctor}
		<div class="rounded-xl border border-border/60 p-3.5">
			<p class="text-xs text-muted-foreground">متخصص</p>
			<p class="mt-0.5 text-sm font-medium">{selectedDoctor.name}</p>
			<p class="text-xs text-muted-foreground">{selectedDoctor.specialty}</p>
			{#if selectedDoctor.visitFee > 0}
				<p class="mt-1 text-xs tabular-nums text-muted-foreground">
					حق ویزیت: {formatToman(selectedDoctor.visitFee)}
				</p>
			{/if}
		</div>
	{/if}
	{#if bookingAmountToman > 0}
		<div class="rounded-xl border border-border/60 p-3.5">
			<p class="text-xs text-muted-foreground">مبلغ قابل پرداخت</p>
			<p class="mt-0.5 text-sm font-semibold tabular-nums">
				{formatToman(bookingAmountToman)}
			</p>
			{#if shouldPayOnline}
				<p
					class="mt-1 inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300"
				>
					<CreditCard class="h-3.5 w-3.5" aria-hidden="true" />
					پرداخت آنلاین از طریق زرین‌پال
					{#if gatewayStatus?.sandbox}
						<span
							class="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
						>
							سندباکس
						</span>
					{/if}
				</p>
			{:else if !deskMode}
				<p class="mt-1 text-xs text-muted-foreground">
					پس از رزرو، پرداخت در مطب انجام می‌شود.
				</p>
			{/if}
		</div>
	{/if}
	<div class="rounded-xl border border-border/60 p-3.5">
		<p class="text-xs text-muted-foreground">زمان</p>
		<p class="mt-0.5 text-sm font-medium">
			{formatFaDate(selectedDate)} — {selectedSlot?.time}
		</p>
		<p class="text-xs text-muted-foreground">حضوری</p>
	</div>
</div>
