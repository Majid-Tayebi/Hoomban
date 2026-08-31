<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { cn } from '$lib/utils';
	import { CloudUpload, X } from '@lucide/svelte';

	let {
		class: className = '',
		selectFiles,
		onClose,
		accept = 'image/jpeg,image/png,image/webp,image/heic,application/pdf',
		disabled = false,
		title = 'آپلود فایل',
		description = 'فایل را بکشید و رها کنید یا انتخاب کنید',
		hint = 'فرمت JPEG، PNG، PDF — حداکثر ۵۰ مگابایت',
		...restProps
	}: {
		class?: string;
		selectFiles?: (files: File[]) => void;
		onClose?: () => void;
		accept?: string;
		disabled?: boolean;
		title?: string;
		description?: string;
		hint?: string;
		[key: string]: unknown;
	} = $props();

	let isDragging = $state(false);
	let dragDepth = $state(0);
	const inputId = `file-upload-${Math.random().toString(36).slice(2, 9)}`;

	function emitFiles(list: FileList | File[] | null | undefined) {
		if (!list?.length || !selectFiles) return;
		selectFiles(Array.from(list));
	}

	function onInputChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		emitFiles(input.files);
		input.value = '';
	}

	function onDragEnter(event: DragEvent) {
		event.preventDefault();
		if (disabled) return;
		dragDepth += 1;
		isDragging = true;
	}

	function onDragLeave(event: DragEvent) {
		event.preventDefault();
		if (disabled) return;
		dragDepth = Math.max(0, dragDepth - 1);
		if (dragDepth === 0) isDragging = false;
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (disabled) return;
		dragDepth = 0;
		isDragging = false;
		emitFiles(event.dataTransfer?.files);
	}
</script>

<div class={cn('w-full', className)} {...restProps}>
	<div class="flex items-start justify-between gap-3">
		<div class="flex items-center gap-3">
			<div
				class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
			>
				<CloudUpload class="h-5 w-5" />
			</div>
			<div>
				<h3 class="text-sm font-semibold sm:text-base">{title}</h3>
				<p class="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
			</div>
		</div>
		{#if onClose}
			<Button
				type="button"
				variant="ghost"
				size="icon"
				class="h-8 w-8 shrink-0 rounded-full"
				onclick={onClose}
				aria-label="بستن"
			>
				<X class="h-4 w-4" />
			</Button>
		{/if}
	</div>

	<div
		class={cn(
			'relative mt-4 overflow-hidden rounded-xl border-2 border-dashed text-center transition-all duration-200 ease-in-out',
			disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
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
			id={inputId}
			type="file"
			multiple
			{accept}
			{disabled}
			class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
			onchange={onInputChange}
			ondragenter={onDragEnter}
			ondragleave={onDragLeave}
			ondragover={onDragOver}
			ondrop={onDrop}
		/>
		<div class="pointer-events-none p-6 sm:p-8">
			<CloudUpload class="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
			<p class="text-sm font-medium">فایل را بکشید و اینجا رها کنید</p>
			<p class="mt-1 text-[11px] text-muted-foreground">{hint}</p>
			<Button type="button" variant="outline" size="sm" class="mt-3 h-8 rounded-lg text-xs">
				انتخاب فایل
			</Button>
		</div>
	</div>
</div>
