<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { canAccessSecretaryPatientDesk, getPatientRecordHref } from '$lib/rbac';
	import { loadDeskAccountingOverview, formatToman } from '$lib/desk';
	import type { DeskAccountingTotals, DeskPatientOverview } from '$lib/desk/types';
	import { globalSearch } from '$lib/search.svelte';
	import DeskAccountingStats from '$lib/desk/components/desk-accounting-stats.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { Wallet } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let user = $derived(getUser());
	let rows = $state<DeskPatientOverview[]>([]);
	let totals = $state<DeskAccountingTotals>({
		patientCount: 0,
		totalBalance: 0,
		totalUnpaidItems: 0,
		totalPaid: 0,
		totalWaived: 0
	});
	let loading = $state(true);

	const filtered = $derived.by(() => {
		const q = globalSearch.query.trim();
		if (!q) return rows;
		const digits = q.replace(/\D/g, '');
		return rows.filter(
			(r) =>
				r.name.includes(q) ||
				r.patientCode.includes(q) ||
				(digits.length > 0 && r.phone.includes(digits))
		);
	});

	async function load() {
		loading = true;
		try {
			const data = await loadDeskAccountingOverview();
			rows = data.patients;
			totals = data.totals;
		} finally {
			loading = false;
		}
	}

	function openPatient(id: string) {
		if (!user) return;
		goto(getPatientRecordHref(id, user.role, 'accounting'));
	}

	function formatDate(d?: Date): string {
		if (!d) return '—';
		return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	const gridClass =
		'grid-cols-[minmax(9rem,1.15fr)_10.5rem_minmax(7.5rem,0.95fr)_minmax(6.5rem,0.85fr)_minmax(6.5rem,0.85fr)_5rem]';
	const phoneColumnClass = 'flex min-w-0 w-full justify-end pe-6 ps-4';
	const phoneCellClass =
		`${phoneColumnClass} truncate text-sm tabular-nums text-muted-foreground`;
	const patientCellClass = 'min-w-0 overflow-hidden';

	function formatPhone(phone: string): string {
		if (phone === '—') return phone;
		return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
	}

	$effect(() => {
		if (user && !canAccessSecretaryPatientDesk(user.role)) {
			goto('/dashboard');
			return;
		}
		if (user && canAccessSecretaryPatientDesk(user.role)) load();
	});
</script>

<div class="space-y-4 sm:space-y-5">
	<DeskAccountingStats {totals} />

	<Card class="overflow-hidden rounded-2xl border-border/60 shadow-sm">
		<CardHeader class="px-4 pb-2 pt-4 sm:px-5">
			<div class="flex items-center gap-2">
				<Wallet class="h-4 w-4 text-primary" />
				<CardTitle class="text-sm font-semibold sm:text-base">وضعیت پرداخت مراجعان</CardTitle>
			</div>
		</CardHeader>
		<CardContent class="px-0 pb-0">
			{#if loading}
				<p class="px-5 py-12 text-center text-sm text-muted-foreground">در حال بارگذاری...</p>
			{:else if filtered.length === 0}
				<p class="px-5 py-12 text-center text-sm text-muted-foreground">
					{globalSearch.query.trim() ? 'نتیجه‌ای برای جستجو یافت نشد.' : 'موردی یافت نشد.'}
				</p>
			{:else}
				<div class="hidden overflow-x-auto md:block">
					<div class="min-w-[860px]">
						<div
							class={cn(
								'grid items-center gap-x-6 border-y border-border/40 bg-muted/30 px-4 py-2.5 text-[11px] font-medium text-muted-foreground sm:gap-x-8 sm:px-5',
								gridClass
							)}
						>
							<span class="min-w-0">مراجع</span>
							<bdi class={phoneColumnClass} dir="ltr">تماس</bdi>
							<span class="min-w-0">آخرین مراجعه</span>
							<span class="min-w-0">درآمد</span>
							<span class="min-w-0">مانده</span>
							<span class="min-w-0 text-center">بدهی باز</span>
						</div>
						<ul class="divide-y divide-border/40">
							{#each filtered as row (row.id)}
								<li>
									<button
										type="button"
										class={cn(
											'grid w-full items-center gap-x-6 px-4 py-3 text-start transition-colors duration-200 hover:bg-muted/30 sm:gap-x-8 sm:px-5',
											gridClass
										)}
										onclick={() => openPatient(row.id)}
									>
										<div class={patientCellClass}>
											<p class="truncate text-sm font-medium leading-snug">{row.name}</p>
											<bdi
												class="mt-0.5 block w-full truncate text-end text-[11px] leading-snug tabular-nums text-muted-foreground"
												dir="ltr"
											>
												{row.patientCode}
											</bdi>
										</div>
										<bdi class={phoneCellClass} dir="ltr">
											{formatPhone(row.phone)}
										</bdi>
										<p class="min-w-0 truncate text-sm text-muted-foreground">
											{formatDate(row.lastVisit)}
										</p>
										<p
											class="min-w-0 truncate text-sm font-medium {row.totalPaid > 0
												? 'text-emerald-700 dark:text-emerald-300'
												: 'text-muted-foreground'}"
										>
											{formatToman(row.totalPaid)}
										</p>
										<p
											class="min-w-0 truncate text-sm font-medium {row.balance > 0
												? 'text-red-600 dark:text-red-400'
												: 'text-muted-foreground'}"
										>
											{formatToman(row.balance)}
										</p>
										<p class="min-w-0 text-center text-sm tabular-nums">
											{row.unpaidCount.toLocaleString('fa-IR')}
										</p>
									</button>
								</li>
							{/each}
						</ul>
					</div>
				</div>

				<div class="space-y-2 p-3 md:hidden">
					{#each filtered as row (row.id)}
						<button
							type="button"
							class="w-full rounded-xl border border-border/50 p-3 text-start transition-colors duration-200 hover:bg-muted/30"
							onclick={() => openPatient(row.id)}
						>
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium">{row.name}</p>
									<bdi
										class="mt-0.5 block w-full truncate text-end text-[11px] tabular-nums text-muted-foreground"
										dir="ltr"
									>
										{row.patientCode}
									</bdi>
									<bdi
										class="mt-0.5 block w-full truncate text-end text-[11px] tabular-nums text-muted-foreground"
										dir="ltr"
									>
										{formatPhone(row.phone)}
									</bdi>
								</div>
								<div class="shrink-0 text-end">
									<p
										class="text-sm font-medium {row.totalPaid > 0
											? 'text-emerald-700 dark:text-emerald-300'
											: 'text-muted-foreground'}"
									>
										{formatToman(row.totalPaid)}
									</p>
									<p class="text-[10px] text-muted-foreground">درآمد</p>
									<p
										class="mt-1 text-sm font-medium {row.balance > 0
											? 'text-red-600 dark:text-red-400'
											: 'text-muted-foreground'}"
									>
										{formatToman(row.balance)}
									</p>
									<p class="text-[10px] text-muted-foreground">مانده</p>
								</div>
							</div>
							<p class="mt-2 text-xs text-muted-foreground">
								{formatDate(row.lastVisit)} · {row.unpaidCount.toLocaleString('fa-IR')} مورد باز
							</p>
						</button>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
