<script lang="ts">
	import { goto } from '$app/navigation';
	import type { DoctorPatientRow } from '../types';
	import { getPatientStatusConfig } from '../services/doctor-detail-data';
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
	import Input from '$lib/components/ui/input.svelte';
	import { MoreVertical, Search } from '@lucide/svelte';

	let { patients }: { patients: DoctorPatientRow[] } = $props();

	let query = $state('');
	const filtered = $derived(
		patients.filter(
			(p) =>
				!query.trim() ||
				p.name.includes(query) ||
				p.patientCode.includes(query) ||
				p.condition.includes(query)
		)
	);

	function initials(name: string): string {
		return name
			.split(' ')
			.map((w) => w.charAt(0))
			.slice(0, 2)
			.join('');
	}
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3 pt-4 px-4 sm:px-5">
		<div>
			<CardTitle class="text-sm font-semibold sm:text-base">بیماران</CardTitle>
			<p class="mt-0.5 text-xs text-muted-foreground">
				{filtered.length.toLocaleString('fa-IR')} مورد
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<div class="relative">
				<Search class="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				<Input
					class="h-9 w-40 rounded-xl pr-8 text-xs sm:w-52"
					placeholder="جستجو بیمار..."
					bind:value={query}
				/>
			</div>
			<select
				class="h-9 rounded-xl border border-input bg-background px-2.5 text-xs text-muted-foreground"
				aria-label="مرتب‌سازی"
			>
				<option>جدیدترین</option>
				<option>نام</option>
			</select>
		</div>
	</CardHeader>
	<CardContent class="px-2 pb-4 sm:px-5">
		<div class="hidden md:block">
			<Table>
				<TableHeader>
					<TableRow class="hover:bg-transparent">
						<TableHead class="w-10"><Checkbox /></TableHead>
						<TableHead>نام</TableHead>
						<TableHead>تاریخ پذیرش</TableHead>
						<TableHead>وضعیت</TableHead>
						<TableHead>درمان</TableHead>
						<TableHead>وضعیت درمان</TableHead>
						<TableHead class="w-10"><span class="sr-only">عملیات</span></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each filtered as p (p.id)}
						{@const status = getPatientStatusConfig(p.status)}
						<TableRow
							class="cursor-pointer"
							onclick={() => goto(`/dashboard/patients/${p.id}`)}
						>
							<TableCell onclick={(e: MouseEvent) => e.stopPropagation()}>
								<Checkbox />
							</TableCell>
							<TableCell>
								<div class="flex items-center gap-2.5">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
									>
										{initials(p.name)}
									</div>
									<div>
										<p class="text-sm font-medium">{p.name}</p>
										<p class="text-[10px] text-muted-foreground" dir="ltr">{p.patientCode}</p>
									</div>
								</div>
							</TableCell>
							<TableCell class="text-xs text-muted-foreground">{p.checkInDate}</TableCell>
							<TableCell class="text-sm">{p.condition}</TableCell>
							<TableCell class="text-xs text-muted-foreground">{p.treatment}</TableCell>
							<TableCell>
								<span class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium {status.class}">
									{status.label}
								</span>
							</TableCell>
							<TableCell onclick={(e: MouseEvent) => e.stopPropagation()}>
								<button type="button" class="rounded-lg p-1.5 hover:bg-muted" aria-label="عملیات">
									<MoreVertical class="h-4 w-4 text-muted-foreground" />
								</button>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>

		<div class="space-y-2 md:hidden">
			{#each filtered as p (p.id)}
				{@const status = getPatientStatusConfig(p.status)}
				<button
					type="button"
					class="flex w-full items-center gap-3 rounded-xl border border-border/50 p-3 text-right"
					onclick={() => goto(`/dashboard/patients/${p.id}`)}
				>
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
					>
						{initials(p.name)}
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium">{p.name}</p>
						<p class="text-[11px] text-muted-foreground" dir="ltr">{p.patientCode}</p>
						<p class="mt-0.5 text-[10px] text-muted-foreground">{p.checkInDate}</p>
					</div>
					<span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium {status.class}">
						{status.label}
					</span>
				</button>
			{/each}
		</div>
	</CardContent>
</Card>
