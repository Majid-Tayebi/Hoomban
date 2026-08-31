<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { cn } from '$lib/utils';
	import { Trash2 } from '@lucide/svelte';

	export type AttachmentFileListItem = {
		id: string;
		name: string;
		type: 'PDF' | 'IMG' | 'DOC' | 'FILE';
		subtype: string;
		sizeBytes?: number;
		status: 'complete' | 'error';
		downloadUrl?: string;
	};

	let {
		class: className = '',
		items = [],
		onDownload,
		onDelete
	}: {
		class?: string;
		items?: AttachmentFileListItem[];
		onDownload?: (item: AttachmentFileListItem) => void;
		onDelete?: (id: string) => void;
	} = $props();

	const typeStyles: Record<
		AttachmentFileListItem['type'],
		{ bg: string; text: string }
	> = {
		PDF: { bg: 'bg-red-500', text: '.PDF' },
		IMG: { bg: 'bg-violet-500', text: '.IMG' },
		DOC: { bg: 'bg-blue-500', text: '.DOC' },
		FILE: { bg: 'bg-muted-foreground', text: 'FILE' }
	};

	function formatSize(bytes?: number): string {
		if (bytes == null || bytes <= 0) return '—';
		if (bytes < 1024 * 1024) {
			return `${Math.round(bytes / 1024).toLocaleString('fa-IR')} KB`;
		}
		return `${(bytes / (1024 * 1024)).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} MB`;
	}

	function handleDownload(item: AttachmentFileListItem) {
		if (onDownload) {
			onDownload(item);
			return;
		}
		if (!item.downloadUrl) return;
		const anchor = document.createElement('a');
		anchor.href = item.downloadUrl;
		anchor.download = item.name;
		anchor.target = '_blank';
		anchor.rel = 'noopener noreferrer';
		anchor.click();
	}
</script>

{#if items.length}
	<div class={cn('divide-y divide-border/60', className)}>
		{#each items as item (item.id)}
			{@const style = typeStyles[item.type]}
			<div class="flex flex-wrap items-center gap-y-1.5 py-2 first:pt-0 last:pb-0">
				<div class="flex min-w-0 flex-1 items-center gap-2.5">
					<div
						class={cn(
							'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg',
							style.bg
						)}
					>
						<div
							class="absolute end-0 top-0 h-4 w-4 bg-card transition-colors duration-200 [clip-path:polygon(100%_0,0_0,100%_100%)]"
						></div>
						<span class="text-sm font-bold text-white">{style.text}</span>
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate font-semibold text-foreground">{item.name}</p>
						{#if item.status === 'error'}
							<p class="text-sm text-destructive">خطا در آپلود</p>
						{:else}
							<p class="text-sm text-muted-foreground">{item.subtype}</p>
						{/if}
					</div>
				</div>

				<div
					class="flex w-full items-center justify-end gap-3 ps-[4.25rem] sm:mt-0 sm:w-auto sm:ps-0"
				>
					<span class="w-16 shrink-0 text-end text-sm font-medium text-muted-foreground">
						{formatSize(item.sizeBytes)}
					</span>
					<div class="flex w-24 shrink-0 items-center justify-end gap-1">
						{#if item.status === 'complete' && item.downloadUrl}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="h-8 px-2 text-xs font-semibold text-primary hover:text-primary/80"
								onclick={() => handleDownload(item)}
							>
								دانلود
							</Button>
						{/if}
						{#if onDelete && item.status === 'complete'}
							<Button
								type="button"
								variant="ghost"
								size="icon"
								class="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
								aria-label="حذف فایل"
								onclick={() => onDelete(item.id)}
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
