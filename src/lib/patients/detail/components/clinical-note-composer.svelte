<script lang="ts">
	import { createClinicalNote, formatClinicalNoteError } from '../services/patient-detail-data';
	import VoiceRecorder from './voice-recorder.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { FileText, LoaderCircle } from '@lucide/svelte';

	let {
		patientId,
		doctorId,
		userId,
		appointments = [],
		onSaved
	}: {
		patientId: string;
		doctorId: string;
		userId: string;
		appointments?: { id: string; label: string }[];
		onSaved?: () => void | Promise<void>;
	} = $props();

	let text = $state('');
	let treatmentPlan = $state('');
	let appointmentId = $state('');
	let audioClips = $state<Blob[]>([]);
	let saving = $state(false);
	let message = $state('');
	let messageOk = $state(false);

	async function submit() {
		if (!text.trim() && !treatmentPlan.trim() && !audioClips.length) {
			message = 'حداقل متن، برنامه درمان یا یک فایل صوتی وارد کنید.';
			messageOk = false;
			return;
		}

		saving = true;
		message = '';
		try {
			await createClinicalNote({
				patientId,
				doctorId,
				userId,
				text: text.trim(),
				treatmentPlan: treatmentPlan.trim(),
				audio: audioClips.length ? audioClips : null,
				appointmentId: appointmentId || undefined
			});
			text = '';
			treatmentPlan = '';
			appointmentId = '';
			audioClips = [];
			message = 'یادداشت با موفقیت ثبت شد.';
			messageOk = true;
			await onSaved?.();
		} catch (e: unknown) {
			message = formatClinicalNoteError(e);
			messageOk = false;
		} finally {
			saving = false;
		}
	}
</script>

<div class="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-2.5 sm:p-3">
	<div class="mb-2 flex items-center gap-2">
		<FileText class="h-4 w-4 text-primary" />
		<h3 class="text-sm font-semibold">ثبت یادداشت جدید</h3>
	</div>

	<div class="space-y-2.5">
		<div class="grid gap-2.5 md:grid-cols-2">
			<div>
				<Label for="note-text" class="text-xs text-muted-foreground">نظر متخصص (جلسه)</Label>
				<textarea
					id="note-text"
					class="mt-1 min-h-[72px] w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring md:min-h-[80px]"
					bind:value={text}
					placeholder="نظر درباره این جلسه و وضعیت مراجع..."
				></textarea>
			</div>

			<div>
				<Label for="note-plan" class="text-xs text-muted-foreground">برنامه درمان (جلسه بعد)</Label>
				<textarea
					id="note-plan"
					class="mt-1 min-h-[72px] w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring md:min-h-[80px]"
					bind:value={treatmentPlan}
					placeholder="توصیه‌ها و اقدامات بعدی..."
				></textarea>
			</div>
		</div>

		<div class="grid gap-2.5 sm:grid-cols-2 sm:items-end">
			{#if appointments.length}
				<div>
					<Label for="note-apt" class="text-xs text-muted-foreground">مرتبط با نوبت (اختیاری)</Label>
					<select
						id="note-apt"
						class="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
						bind:value={appointmentId}
					>
						<option value="">— بدون ارتباط —</option>
						{#each appointments as apt (apt.id)}
							<option value={apt.id}>{apt.label}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div class={appointments.length ? '' : 'sm:col-span-2'}>
				<p class="mb-1 text-xs text-muted-foreground">ضبط صوتی</p>
				<VoiceRecorder bind:clips={audioClips} />
			</div>
		</div>

		{#if message}
			<p class="text-xs {messageOk ? 'text-emerald-700' : 'text-destructive'}">{message}</p>
		{/if}

		<Button type="button" class="h-8 rounded-lg text-xs sm:h-9 sm:text-sm" disabled={saving} onclick={submit}>
			{#if saving}
				<LoaderCircle class="ms-1.5 h-4 w-4 animate-spin" />
				در حال ذخیره...
			{:else}
				ذخیره یادداشت
			{/if}
		</Button>
	</div>
</div>
