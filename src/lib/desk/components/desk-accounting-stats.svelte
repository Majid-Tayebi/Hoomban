<script lang="ts">
	import MetricCard from '$lib/components/ui/metric-card.svelte';
	import { formatToman } from '../types';
	import type { DeskAccountingTotals } from '../types';
	import { Users, AlertCircle, Wallet, Receipt } from '@lucide/svelte';

	let { totals }: { totals: DeskAccountingTotals } = $props();
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
	<MetricCard
		label="مراجعان"
		value={totals.patientCount}
		subtext="دارای پرونده مالی"
		icon={Users}
		tone="primary"
	/>
	<MetricCard
		label="بدهی باز (کل)"
		formattedValue={formatToman(totals.totalBalance)}
		subtext="مانده پرداخت‌نشده"
		icon={AlertCircle}
		tone="rose"
	/>
	<MetricCard
		label="پرداخت‌ها"
		formattedValue={formatToman(totals.totalPaid)}
		subtext="جمع دریافتی ثبت‌شده"
		icon={Wallet}
		tone="emerald"
	/>
	<MetricCard
		label="نوبت/خدمت پرداخت‌نشده"
		value={totals.totalUnpaidItems}
		subtext="مورد در انتظار تسویه"
		icon={Receipt}
		tone="amber"
	/>
</div>
