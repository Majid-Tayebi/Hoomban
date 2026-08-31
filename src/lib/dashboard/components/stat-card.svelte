<script lang="ts">
	import type { DashboardStat } from '../types';
	import MetricCard, { type MetricTone } from '$lib/components/ui/metric-card.svelte';
	import { formatAmount } from '$lib/money';
	import {
		Eye,
		Users,
		CalendarDays,
		Stethoscope,
		Clock,
		CalendarCheck2,
		CheckCircle2,
		FileText,
		Wallet
	} from '@lucide/svelte';

	let { stat }: { stat: DashboardStat } = $props();

	const iconMap = {
		visitors: Eye,
		patients: Users,
		appointments: CalendarDays,
		doctors: Stethoscope,
		today: Clock,
		upcoming: CalendarCheck2,
		completed: CheckCircle2,
		articles: FileText,
		revenue: Wallet
	};

	const toneMap: Record<DashboardStat['icon'], MetricTone> = {
		visitors: 'sky',
		patients: 'primary',
		appointments: 'violet',
		doctors: 'sky',
		today: 'amber',
		upcoming: 'sky',
		completed: 'emerald',
		articles: 'violet',
		revenue: 'emerald'
	};

	const Icon = $derived(iconMap[stat.icon] ?? CalendarDays);
	const tone = $derived(toneMap[stat.icon] ?? 'primary');
</script>

<MetricCard
	label={stat.label}
	value={stat.value}
	formattedValue={stat.icon === 'revenue' ? formatAmount(stat.value) : undefined}
	subtext={stat.subtext}
	icon={Icon}
	{tone}
/>
