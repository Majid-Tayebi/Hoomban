<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PatientListItem } from '../types';
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
	import TablePagination from '$lib/components/ui/table-pagination.svelte';

	let {
		patients,
		loading = false,
		pageSize = 12
	}: {
		patients: PatientListItem[];
		loading?: boolean;
		pageSize?: number;
	} = $props();

	let page = $state(1);

	const paginated = $derived.by(() => {
		const start = (page - 1) * pageSize;
		return patients.slice(start, start + pageSize);
	});

	$effect(() => {
		const maxPage = Math.max(1, Math.ceil(patients.length / pageSize));
		if (page > maxPage) page = maxPage;
	});

	function openPatient(id: string) {
		goto(`/dashboard/patients/${id}`);
	}

	function specialistLabel(p: PatientListItem): string {
		if (p.doctorName && p.doctorName !== '—') {
			return p.specialty && p.specialty !== p.doctorName
				? `${p.doctorName} · ${p.specialty}`
				: p.doctorName;
		}
		return p.specialty && p.specialty !== '—' ? p.specialty : '—';
	}
</script>

<Card class="overflow-hidden rounded-2xl border-border/60 shadow-sm">
	<CardHeader
		class="flex-row flex-wrap items-center justify-between gap-3 space-y-0 px-4 pb-3 pt-4 sm:px-5"
	>
		<div>
			<CardTitle class="text-sm font-semibold sm:text-base">فهرست مراجعان</CardTitle>
			<p class="mt-0.5 text-xs text-muted-foreground">
				{loading ? 'در حال بارگذاری...' : `${patients.length.toLocaleString('fa-IR')} مراجع`}
			</p>
		</div>
	</CardHeader>

	<CardContent class="px-0 pb-0 sm:px-0">
		{#if !loading && patients.length === 0}
			<p class="px-5 py-10 text-center text-sm text-muted-foreground">مراجعی یافت نشد.</p>
		{:else}
			<div class="hidden md:block">
				<Table>
					<TableHeader>
						<TableRow class="border-border/40 bg-muted/30 hover:bg-muted/30">
							<TableHead class="w-[28%] min-w-[9rem] text-right text-[11px] font-medium">
								نام مراجع
							</TableHead>
							<TableHead class="w-[14%] min-w-[6.5rem] text-right text-[11px] font-medium">
								شماره پرونده
							</TableHead>
							<TableHead class="w-[18%] min-w-[7.5rem] text-right text-[11px] font-medium">
								تماس
							</TableHead>
							<TableHead class="text-right text-[11px] font-medium">متخصص مراجعه</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each paginated as p (p.id)}
							<TableRow
								class="cursor-pointer transition-colors duration-200 hover:bg-muted/40"
								onclick={() => openPatient(p.id)}
							>
								<TableCell class="py-3 text-sm font-semibold text-primary">
									<span class="block truncate">{p.name}</span>
								</TableCell>
								<TableCell class="py-3 text-sm tabular-nums text-muted-foreground" dir="ltr">
									<span class="block truncate text-right">{p.patientCode}</span>
								</TableCell>
								<TableCell class="py-3 text-sm tabular-nums" dir="ltr">
									<span class="block truncate text-right">{p.mobile}</span>
								</TableCell>
								<TableCell class="py-3 text-sm text-foreground">
									<span class="block truncate">{specialistLabel(p)}</span>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>

			<div class="md:hidden">
				<div class="divide-y divide-border/60 px-3">
					{#each paginated as p (p.id)}
						<button
							type="button"
							class="flex w-full flex-col gap-1 py-3 text-right transition-colors duration-200 hover:bg-muted/30 active:bg-muted/50"
							onclick={() => openPatient(p.id)}
						>
							<span class="text-sm font-semibold text-primary">{p.name}</span>
							<span class="text-[11px] tabular-nums text-muted-foreground" dir="ltr">
								{p.patientCode}
							</span>
							<span class="text-xs tabular-nums" dir="ltr">{p.mobile}</span>
							<span class="text-xs text-muted-foreground">{specialistLabel(p)}</span>
						</button>
					{/each}
				</div>
			</div>

			<TablePagination bind:page {pageSize} total={patients.length} />
		{/if}
	</CardContent>
</Card>
