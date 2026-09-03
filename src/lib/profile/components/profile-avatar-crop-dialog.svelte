<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { ZoomIn, ZoomOut } from '@lucide/svelte';

	let {
		open = $bindable(false),
		file = null,
		onConfirm,
		onCancel
	}: {
		open?: boolean;
		file?: File | null;
		onConfirm: (cropped: File) => void;
		onCancel: () => void;
	} = $props();

	const OUTPUT_SIZE = 512;
	const MIN_ZOOM = 1;
	const MAX_ZOOM = 3;

	let imageUrl = $state<string | null>(null);
	let imageEl = $state<HTMLImageElement | null>(null);
	let viewportEl = $state<HTMLDivElement | null>(null);
	let baseScale = $state(1);
	let zoom = $state(1);
	let offsetX = $state(0);
	let offsetY = $state(0);
	let dragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let dragOriginX = $state(0);
	let dragOriginY = $state(0);
	let processing = $state(false);

	$effect(() => {
		if (!open || !file) {
			if (imageUrl) URL.revokeObjectURL(imageUrl);
			imageUrl = null;
			baseScale = 1;
			zoom = 1;
			offsetX = 0;
			offsetY = 0;
			return;
		}
		const url = URL.createObjectURL(file);
		imageUrl = url;
		baseScale = 1;
		zoom = 1;
		offsetX = 0;
		offsetY = 0;
		return () => URL.revokeObjectURL(url);
	});

	function syncBaseScale() {
		if (!imageEl || !viewportEl || !imageEl.naturalWidth) return;
		const vw = viewportEl.clientWidth;
		const vh = viewportEl.clientHeight;
		baseScale = Math.max(vw / imageEl.naturalWidth, vh / imageEl.naturalHeight);
	}

	const totalScale = $derived(baseScale * zoom);

	function clampOffsets(nextX: number, nextY: number, nextZoom = zoom) {
		if (!imageEl || !viewportEl) return { x: nextX, y: nextY };
		const vw = viewportEl.clientWidth;
		const vh = viewportEl.clientHeight;
		const scale = baseScale * nextZoom;
		const renderedW = imageEl.naturalWidth * scale;
		const renderedH = imageEl.naturalHeight * scale;
		const maxX = Math.max(0, (renderedW - vw) / 2);
		const maxY = Math.max(0, (renderedH - vh) / 2);
		return {
			x: Math.min(maxX, Math.max(-maxX, nextX)),
			y: Math.min(maxY, Math.max(-maxY, nextY))
		};
	}

	function onPointerDown(event: PointerEvent) {
		if (!viewportEl) return;
		dragging = true;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
		dragOriginX = offsetX;
		dragOriginY = offsetY;
		viewportEl.setPointerCapture(event.pointerId);
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;
		const dx = event.clientX - dragStartX;
		const dy = event.clientY - dragStartY;
		const clamped = clampOffsets(dragOriginX + dx, dragOriginY + dy);
		offsetX = clamped.x;
		offsetY = clamped.y;
	}

	function onPointerUp(event: PointerEvent) {
		if (!dragging || !viewportEl) return;
		dragging = false;
		viewportEl.releasePointerCapture(event.pointerId);
	}

	function setZoom(next: number) {
		const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
		const clamped = clampOffsets(offsetX, offsetY, clampedZoom);
		zoom = clampedZoom;
		offsetX = clamped.x;
		offsetY = clamped.y;
	}

	async function exportCropped(): Promise<File | null> {
		if (!imageEl || !viewportEl || !file) return null;
		const vw = viewportEl.clientWidth;
		const vh = viewportEl.clientHeight;
		const scale = baseScale * zoom;
		const renderedW = imageEl.naturalWidth * scale;
		const renderedH = imageEl.naturalHeight * scale;
		const imageLeft = vw / 2 - renderedW / 2 + offsetX;
		const imageTop = vh / 2 - renderedH / 2 + offsetY;

		const sx = Math.max(0, -imageLeft / scale);
		const sy = Math.max(0, -imageTop / scale);
		const sw = Math.min(imageEl.naturalWidth - sx, vw / scale);
		const sh = Math.min(imageEl.naturalHeight - sy, vh / scale);

		const canvas = document.createElement('canvas');
		canvas.width = OUTPUT_SIZE;
		canvas.height = OUTPUT_SIZE;
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', 0.92)
		);
		if (!blob) return null;
		const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
		return new File([blob], `${baseName}-cropped.jpg`, { type: 'image/jpeg' });
	}

	async function confirmCrop() {
		processing = true;
		try {
			const cropped = await exportCropped();
			if (!cropped) return;
			onConfirm(cropped);
			open = false;
		} finally {
			processing = false;
		}
	}

	function handleCancel() {
		onCancel();
		open = false;
	}
</script>

<Dialog bind:open class="max-w-lg">
	<h2 class="text-lg font-semibold tracking-tight">تنظیم عکس پروفایل</h2>
	<p class="mt-1 text-sm text-muted-foreground">
		برای جابجایی بکشید و با اسلایدر زوم را تنظیم کنید.
	</p>

	<div
		bind:this={viewportEl}
		class="relative mt-4 aspect-square w-full cursor-grab overflow-hidden rounded-2xl bg-muted active:cursor-grabbing"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onpointerleave={onPointerUp}
	>
		{#if imageUrl}
			<img
				bind:this={imageEl}
				src={imageUrl}
				alt="پیش‌نمایش عکس"
				class="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
				style="width: {imageEl?.naturalWidth ?? 0}px; height: {imageEl?.naturalHeight ?? 0}px; transform: translate(calc(-50% + {offsetX}px), calc(-50% + {offsetY}px)) scale({totalScale}); transform-origin: center;"
				draggable="false"
				onload={syncBaseScale}
			/>
		{/if}
		<div
			class="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-background/80"
		></div>
	</div>

	<div class="mt-4 space-y-2">
		<Label for="avatar-zoom">زوم</Label>
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors duration-200 hover:bg-muted"
				aria-label="کاهش زوم"
				onclick={() => setZoom(zoom - 0.1)}
			>
				<ZoomOut class="size-4" />
			</button>
			<input
				id="avatar-zoom"
				type="range"
				min={MIN_ZOOM}
				max={MAX_ZOOM}
				step="0.05"
				bind:value={zoom}
				oninput={() => setZoom(zoom)}
				class="h-2 w-full cursor-pointer accent-primary"
			/>
			<button
				type="button"
				class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors duration-200 hover:bg-muted"
				aria-label="افزایش زوم"
				onclick={() => setZoom(zoom + 0.1)}
			>
				<ZoomIn class="size-4" />
			</button>
		</div>
	</div>

	<div class="mt-6 flex flex-wrap justify-end gap-2">
		<Button type="button" variant="outline" class="rounded-xl" onclick={handleCancel}>انصراف</Button>
		<Button type="button" class="rounded-xl" disabled={processing || !imageUrl} onclick={confirmCrop}>
			{processing ? 'در حال پردازش...' : 'تأیید و استفاده'}
		</Button>
	</div>
</Dialog>
