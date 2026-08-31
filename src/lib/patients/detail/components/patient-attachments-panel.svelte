<script lang="ts">
	import type { PatientAttachmentRow } from '../types';
	import type { AttachmentFileListItem } from '$lib/components/ui/attachment-file-list.svelte';
	import {
		attachmentCategoryLabel,
		createPatientAttachment,
		deletePatientAttachment,
		formatAttachmentUploadError,
		getAttachmentFileUrl
	} from '../services/patient-attachments';
	import { pb } from '$lib/pocketbase';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import UploadProgressBar from '$lib/components/ui/upload-progress-bar.svelte';
	import AttachmentFileList from '$lib/components/ui/attachment-file-list.svelte';
	import { cn } from '$lib/utils';
	import { CloudUpload, FileImage } from '@lucide/svelte';

	let {
		patientId,
		doctorId,
		userId,
		attachments = $bindable([]),
		canWrite = false,
		onChanged
	}: {
		patientId: string;
		doctorId: string;
		userId: string;
		attachments?: PatientAttachmentRow[];
		canWrite?: boolean;
		onChanged?: () => void | Promise<void>;
	} = $props();

	const MAX_BYTES = 50 * 1024 * 1024;
	const ALLOWED_EXT = /\.(jpe?g|png|webp|heic|pdf)$/i;

	type UploadEntry = {
		id: string;
		file: File;
		progress: number;
		status: 'uploading' | 'completed' | 'error';
		errorMessage?: string;
	};

	let uploadQueue = $state<UploadEntry[]>([]);
	let error = $state('');
	let isDragging = $state(false);
	let dragDepth = $state(0);
	let fileInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		const input = fileInput;
		if (!input) return;
		const onChange = (event: Event) => handleInputChange(event);
		input.addEventListener('change', onChange);
		return () => input.removeEventListener('change', onChange);
	});

	const pendingUploads = $derived(
		uploadQueue.filter((entry) => entry.status === 'uploading' || entry.status === 'error')
	);

	const fileListItems = $derived.by((): AttachmentFileListItem[] => {
		return attachments.map((item) => ({
			id: item.id,
			name: item.title,
			type: fileTypeFromName(item.fileName),
			subtype: attachmentCategoryLabel(item.category),
			status: 'complete' as const,
			downloadUrl: getAttachmentFileUrl(item.id, item.fileName)
		}));
	});

	function fileTypeFromName(fileName: string): AttachmentFileListItem['type'] {
		const ext = fileName.split('.').pop()?.toLowerCase();
		if (ext === 'pdf') return 'PDF';
		if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext ?? '')) return 'IMG';
		if (['doc', 'docx'].includes(ext ?? '')) return 'DOC';
		return 'FILE';
	}

	function inferCategory(file: File): PatientAttachmentRow['category'] {
		if (file.type === 'application/pdf') return 'document';
		if (file.type.startsWith('image/')) return 'photo';
		return 'document';
	}

	function updateQueue(id: string, patch: Partial<UploadEntry>) {
		uploadQueue = uploadQueue.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
	}

	async function uploadOne(id: string, file: File) {
		if (!pb.authStore.isValid) {
			const message = 'نشست شما منقضی شده — صفحه را رفرش کنید و دوباره وارد شوید.';
			updateQueue(id, { status: 'error', progress: 0, errorMessage: message });
			error = message;
			return;
		}

		if (!doctorId) {
			updateQueue(id, {
				status: 'error',
				progress: 0,
				errorMessage: 'پزشک مرتبط یافت نشد — امکان آپلود نیست.'
			});
			error = 'پزشک مرتبط یافت نشد — امکان آپلود نیست.';
			return;
		}

		updateQueue(id, { progress: 12 });
		let simulatedProgress = 12;
		const tick = setInterval(() => {
			simulatedProgress = Math.min(90, simulatedProgress + 8);
			updateQueue(id, { progress: simulatedProgress });
		}, 250);

		try {
			await createPatientAttachment({
				patientId,
				doctorId,
				userId,
				title: file.name.replace(/\.[^.]+$/, ''),
				category: inferCategory(file),
				file
			});
			clearInterval(tick);
			updateQueue(id, { progress: 100, status: 'completed' });
			error = '';
			await onChanged?.();
			setTimeout(() => {
				uploadQueue = uploadQueue.filter((entry) => entry.id !== id);
			}, 800);
		} catch (e: unknown) {
			clearInterval(tick);
			const message = formatAttachmentUploadError(e);
			updateQueue(id, { status: 'error', progress: 0, errorMessage: message });
			error = message;
		}
	}

	function queueFiles(newFiles: File[]) {
		error = '';
		const nextEntries: UploadEntry[] = [];

		for (const file of newFiles) {
			if (!ALLOWED_EXT.test(file.name)) {
				error = `«${file.name}» پشتیبانی نمی‌شود. فقط JPEG، PNG، WebP، HEIC و PDF مجاز است.`;
				continue;
			}
			if (file.size > MAX_BYTES) {
				error = `«${file.name}» بیش از ۵۰ مگابایت است.`;
				continue;
			}

			nextEntries.push({
				id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				file,
				progress: 8,
				status: 'uploading'
			});
		}

		if (!nextEntries.length) return;

		uploadQueue = [...uploadQueue, ...nextEntries];
		for (const entry of nextEntries) {
			void uploadOne(entry.id, entry.file);
		}
	}

	function handleInputChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = input.files;
		if (files?.length) queueFiles(Array.from(files));
		input.value = '';
	}

	function onDragEnter(event: DragEvent) {
		event.preventDefault();
		dragDepth += 1;
		isDragging = true;
	}

	function onDragLeave(event: DragEvent) {
		event.preventDefault();
		dragDepth = Math.max(0, dragDepth - 1);
		if (dragDepth === 0) isDragging = false;
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		dragDepth = 0;
		isDragging = false;
		const files = event.dataTransfer?.files;
		if (files?.length) queueFiles(Array.from(files));
	}

	function handleCancelUpload(id: string) {
		uploadQueue = uploadQueue.filter((entry) => entry.id !== id);
	}

	async function removeAttachment(id: string) {
		if (!confirm('این پیوست حذف شود؟')) return;
		try {
			await deletePatientAttachment(id);
			attachments = attachments.filter((a) => a.id !== id);
			await onChanged?.();
		} catch {
			error = 'خطا در حذف پیوست';
		}
	}
</script>

<Card class="rounded-2xl border-border/50 shadow-sm">
	<CardHeader class="flex-row flex-wrap items-center justify-between gap-2 space-y-0 px-3 pb-2 pt-3 sm:px-4">
		<div>
			<CardTitle class="text-sm font-semibold">مدارک و پیوست‌ها</CardTitle>
			<CardDescription class="text-[11px]">JPEG، PNG، PDF — حداکثر ۵۰ مگابایت</CardDescription>
		</div>
	</CardHeader>

	<CardContent class="space-y-3 px-3 pb-3 sm:px-4">
		{#if canWrite && doctorId && userId}
			<label
				class={cn(
					'block cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all duration-200 ease-in-out sm:p-5',
					isDragging
						? 'border-primary bg-primary/10'
						: 'border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-primary/5'
				)}
				ondragenter={onDragEnter}
				ondragleave={onDragLeave}
				ondragover={onDragOver}
				ondrop={onDrop}
			>
				<input
					bind:this={fileInput}
					type="file"
					multiple
					accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.jpg,.jpeg,.png,.webp,.heic,.pdf"
					class="sr-only"
				/>
				<CloudUpload class="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
				<p class="text-xs font-medium sm:text-sm">فایل را بکشید یا انتخاب کنید</p>
				<span
					class="mt-2 inline-flex h-7 items-center justify-center rounded-lg border border-input bg-background px-2.5 text-[11px] font-medium pointer-events-none sm:h-8 sm:text-xs"
				>
					انتخاب فایل
				</span>
			</label>
		{:else if canWrite && !doctorId}
			<p class="text-xs text-destructive">پزشک مرتبط یافت نشد — امکان آپلود نیست.</p>
		{/if}

		{#if pendingUploads.length}
			<div class="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-3">
				{#each pendingUploads as entry (entry.id)}
					<div class="space-y-1">
						<div class="flex items-center justify-between gap-2">
							<p class="truncate text-xs text-muted-foreground">{entry.file.name}</p>
							<button
								type="button"
								class="shrink-0 text-[11px] font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
								onclick={() => handleCancelUpload(entry.id)}
							>
								{entry.status === 'error' ? 'بستن' : 'لغو'}
							</button>
						</div>
						{#if entry.status === 'uploading'}
							<UploadProgressBar progress={entry.progress} />
						{:else}
							<p class="text-xs text-destructive">{entry.errorMessage ?? error}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if error}
			<p class="text-xs text-destructive">{error}</p>
		{/if}

		{#if fileListItems.length}
			<AttachmentFileList
				items={fileListItems}
				onDelete={canWrite ? removeAttachment : undefined}
			/>
		{:else if !canWrite && !pendingUploads.length}
			<div
				class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center"
			>
				<FileImage class="mb-1.5 h-6 w-6 text-muted-foreground" />
				<p class="text-xs text-muted-foreground sm:text-sm">هنوز مدرکی آپلود نشده</p>
			</div>
		{/if}
	</CardContent>
</Card>
