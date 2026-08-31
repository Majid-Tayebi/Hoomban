<script lang="ts">
	import type { LedgerRow } from '../types';
	import { formatToman } from '../types';
	import {
		isLedgerSettled,
		isOnlineGatewayPayment,
		ledgerRowRemaining
	} from '../ledger-display';

	let { row, compact = false }: { row: LedgerRow; compact?: boolean } = $props();

	const remaining = $derived(ledgerRowRemaining(row));
	const settled = $derived(isLedgerSettled(row));
	const onlinePaid = $derived(isOnlineGatewayPayment(row));
</script>

<div class="min-w-0 space-y-0.5 {compact ? 'text-xs' : 'text-sm'}">
	<p class="text-[11px] text-muted-foreground">هزینه: {formatToman(row.expectedAmount)}</p>

	{#if row.status === 'waived'}
		{#if row.waivedAmount > 0}
			<p class="font-medium text-slate-600 dark:text-slate-400">
				بخشودگی: {formatToman(row.waivedAmount)}
			</p>
		{/if}
		<p class="text-muted-foreground">بدهی: {formatToman(0)}</p>
	{:else if settled}
		{#if row.paidAmount > 0}
			<p class="font-semibold text-emerald-700 dark:text-emerald-300">
				درآمد: {formatToman(row.paidAmount)}
				{#if onlinePaid}
					<span class="ms-1 text-[10px] font-normal text-emerald-600/80">(آنلاین)</span>
				{/if}
			</p>
		{/if}
		{#if row.waivedAmount > 0}
			<p class="text-[11px] text-slate-600 dark:text-slate-400">
				بخشودگی: {formatToman(row.waivedAmount)}
			</p>
		{/if}
		<p class="text-muted-foreground">بدهی: {formatToman(0)}</p>
	{:else}
		{#if row.paidAmount > 0}
			<p class="font-semibold text-emerald-700 dark:text-emerald-300">
				درآمد: {formatToman(row.paidAmount)}
			</p>
		{/if}
		{#if row.waivedAmount > 0}
			<p class="text-[11px] text-slate-600 dark:text-slate-400">
				بخشودگی: {formatToman(row.waivedAmount)}
			</p>
		{/if}
		<p class="font-semibold text-red-600 dark:text-red-400">
			مانده: {formatToman(remaining)}
		</p>
	{/if}
</div>
