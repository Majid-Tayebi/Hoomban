<script lang="ts">
	import type { AppointmentStat } from '../types';
	import MetricCard, { type MetricTone } from '$lib/components/ui/metric-card.svelte';
	import { CalendarDays, CheckCircle2, Clock, XCircle } from '@lucide/svelte';

	let { stat }: { stat: AppointmentStat } = $props();

	const iconMap = {
		today: CalendarDays,
		completed: CheckCircle2,
		ongoing: Clock,
		cancelled: XCircle
	};

	const toneMap: Record<AppointmentStat['icon'], MetricTone> = {
		today: 'sky',
		completed: 'emerald',
		ongoing: 'amber',
		cancelled: 'rose'
	};

	const Icon = $derived(iconMap[stat.icon]);
	const tone = $derived(toneMap[stat.icon]);
</script>

<MetricCard label={stat.label} value={stat.value} subtext={stat.subtext} icon={Icon} {tone} />
