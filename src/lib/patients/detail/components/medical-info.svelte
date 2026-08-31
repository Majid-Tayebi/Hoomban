<script lang="ts">
	import type { MedicationItem, PatientAllergy, PatientCondition } from '../types';
	import { getMedicationStatusConfig } from '../services/patient-detail-data';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Table from '$lib/components/ui/table.svelte';
	import TableHeader from '$lib/components/ui/table-header.svelte';
	import TableBody from '$lib/components/ui/table-body.svelte';
	import TableRow from '$lib/components/ui/table-row.svelte';
	import TableHead from '$lib/components/ui/table-head.svelte';
	import TableCell from '$lib/components/ui/table-cell.svelte';
	import Checkbox from '$lib/components/ui/checkbox.svelte';
	import { Activity, MoreVertical } from '@lucide/svelte';

	let {
		conditions,
		allergies,
		medications
	}: {
		conditions: PatientCondition[];
		allergies: PatientAllergy[];
		medications: MedicationItem[];
	} = $props();
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4 sm:px-5">
		<CardTitle class="text-sm font-semibold sm:text-base">اطلاعات پزشکی</CardTitle>
		<button type="button" class="rounded-lg p-1.5 hover:bg-muted" aria-label="گزینه‌ها">
			<MoreVertical class="h-4 w-4 text-muted-foreground" />
		</button>
	</CardHeader>
	<CardContent class="space-y-5 px-4 pb-4 sm:px-5">
		<div>
			<p class="mb-2 text-xs font-medium text-muted-foreground">شرایط</p>
			<div class="flex flex-wrap gap-2">
				{#each conditions as c (c.id)}
					<span
						class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
					>
						<Activity class="h-3 w-3" />
						{c.label}
					</span>
				{/each}
			</div>
		</div>

		<div>
			<p class="mb-2 text-xs font-medium text-muted-foreground">حساسیت‌ها</p>
			<ul class="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
				{#each allergies as a (a.id)}
					<li class="flex items-center gap-2">
						<span class="h-2 w-2 rounded-full" style="background-color: {a.color}"></span>
						{a.label}
					</li>
				{/each}
			</ul>
		</div>

		<div>
			<p class="mb-2 text-xs font-medium text-muted-foreground">داروها</p>
			<div class="hidden md:block">
				<Table>
					<TableHeader>
						<TableRow class="hover:bg-transparent">
							<TableHead class="w-10"><Checkbox /></TableHead>
							<TableHead>نام</TableHead>
							<TableHead>دوز</TableHead>
							<TableHead>دفعات</TableHead>
							<TableHead>بازه</TableHead>
							<TableHead>وضعیت</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each medications as med (med.id)}
							{@const status = getMedicationStatusConfig(med.status)}
							<TableRow>
								<TableCell><Checkbox /></TableCell>
								<TableCell class="font-medium">{med.name}</TableCell>
								<TableCell class="text-muted-foreground">{med.dosage}</TableCell>
								<TableCell class="text-muted-foreground">{med.frequency}</TableCell>
								<TableCell class="text-xs text-muted-foreground">{med.period}</TableCell>
								<TableCell>
									<span class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium {status.class}">
										{status.label}
									</span>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>

			<div class="space-y-2 md:hidden">
				{#each medications as med (med.id)}
					{@const status = getMedicationStatusConfig(med.status)}
					<div class="rounded-xl border border-border/50 p-3">
						<div class="flex items-start justify-between gap-2">
							<p class="font-medium">{med.name}</p>
							<span class="rounded-full px-2 py-0.5 text-[10px] font-medium {status.class}">
								{status.label}
							</span>
						</div>
						<p class="mt-1 text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
						<p class="text-[11px] text-muted-foreground">{med.period}</p>
					</div>
				{/each}
			</div>
		</div>
	</CardContent>
</Card>
