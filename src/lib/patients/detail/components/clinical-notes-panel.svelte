<script lang="ts">
	import type { ClinicalNoteRow } from '../types';
	import { deleteClinicalNote } from '../services/patient-detail-data';
	import ClinicalNoteComposer from './clinical-note-composer.svelte';
	import { pb } from '$lib/pocketbase';
	import { formatFaDateTime } from '$lib/date';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { Trash2 } from '@lucide/svelte';

	let {
		notes = $bindable([]),
		patientId,
		doctorId = null,
		userId = '',
		canWrite = false,
		appointments = [],
		onRefresh
	}: {
		notes?: ClinicalNoteRow[];
		patientId: string;
		doctorId?: string | null;
		userId?: string;
		canWrite?: boolean;
		appointments?: { id: string; label: string }[];
		onRefresh?: () => void | Promise<void>;
	} = $props();

	async function removeNote(id: string) {
		if (!confirm('این یادداشت حذف شود؟')) return;
		try {
			await deleteClinicalNote(id);
			notes = notes.filter((n) => n.id !== id);
			await onRefresh?.();
		} catch {
			alert('خطا در حذف یادداشت');
		}
	}
</script>

<Card class="rounded-2xl border-primary/30 shadow-sm">
	<CardHeader class="flex-row items-center gap-2 space-y-0 px-3 pb-2 pt-3 sm:px-4">
		<CardTitle class="text-sm font-semibold">یادداشت پرونده</CardTitle>
		<CardDescription class="text-[11px]">
			برای هر جلسه: نظر متخصص + برنامه درمان جلسه بعد
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-3 px-3 pb-3 sm:px-4">
		{#if canWrite && doctorId && userId}
			<ClinicalNoteComposer
				{patientId}
				{doctorId}
				{userId}
				{appointments}
				onSaved={onRefresh}
			/>
		{/if}

		<div class="space-y-2">
			{#each notes as n (n.id)}
				<div class="rounded-xl border border-border/60 p-2.5 sm:p-3">
					<div class="mb-2 flex items-start justify-between gap-2">
						<div>
							<p class="text-xs font-medium text-foreground">{n.doctorName}</p>
							{#if n.sessionDate}
								<p class="text-[11px] tabular-nums text-muted-foreground">
									{formatFaDateTime(new Date(n.sessionDate))}
								</p>
							{/if}
						</div>
						{#if canWrite}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="h-7 w-7 shrink-0 rounded-lg p-0 text-destructive hover:bg-destructive/10"
								aria-label="حذف یادداشت"
								onclick={() => removeNote(n.id)}
							>
								<Trash2 class="h-3.5 w-3.5" />
							</Button>
						{/if}
					</div>
					{#if n.text}
						<div class="space-y-1">
							<p class="text-[11px] font-medium text-muted-foreground">نظر متخصص (جلسه)</p>
							<p class="whitespace-pre-wrap text-sm leading-relaxed">{n.text}</p>
						</div>
					{/if}
					{#if n.treatmentPlan}
						<div class="mt-2.5 space-y-1 {n.text ? 'border-t border-border/50 pt-2.5' : ''}">
							<p class="text-[11px] font-medium text-muted-foreground">برنامه درمان (جلسه بعد)</p>
							<p class="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
								{n.treatmentPlan}
							</p>
						</div>
					{/if}
					{#if !n.text && !n.treatmentPlan}
						<p class="text-sm text-muted-foreground">متنی برای این جلسه ثبت نشده.</p>
					{/if}
					{#each n.audio as file (file)}
						<audio
							class="mt-2 w-full"
							controls
							src={pb.files.getURL(
								{
									id: n.id,
									collectionId: 'pbc_clinical_notes',
									collectionName: 'clinical_notes'
								} as never,
								file
							)}
						>
							<track kind="captions" />
						</audio>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">هنوز یادداشتی برای جلسات ثبت نشده.</p>
			{/each}
		</div>
	</CardContent>
</Card>
