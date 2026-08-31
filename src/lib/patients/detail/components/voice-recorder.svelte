<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { Mic, Square, Trash2 } from '@lucide/svelte';

	let {
		clips = $bindable([] as Blob[])
	}: {
		clips?: Blob[];
	} = $props();

	let recording = $state(false);
	let error = $state('');
	let previewUrl = $state<string | null>(null);
	let recorder = $state<MediaRecorder | null>(null);
	let activeStream = $state<MediaStream | null>(null);
	let chunks = $state<BlobPart[]>([]);

	const canRecord = $derived(
		typeof window !== 'undefined' &&
			window.isSecureContext &&
			typeof navigator !== 'undefined' &&
			Boolean(navigator.mediaDevices?.getUserMedia) &&
			typeof MediaRecorder !== 'undefined'
	);

	function revokePreview() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}
	}

	function stopStream() {
		activeStream?.getTracks().forEach((track) => track.stop());
		activeStream = null;
	}

	function createMediaRecorder(stream: MediaStream): MediaRecorder {
		const candidates = [
			'audio/webm;codecs=opus',
			'audio/webm',
			'audio/ogg;codecs=opus',
			'audio/mp4'
		];
		for (const mimeType of candidates) {
			if (MediaRecorder.isTypeSupported(mimeType)) {
				return new MediaRecorder(stream, { mimeType });
			}
		}
		return new MediaRecorder(stream);
	}

	function micErrorMessage(err: unknown): string {
		if (err instanceof DOMException) {
			if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
				return 'دسترسی به میکروفون رد شد. در تنظیمات مرورگر مجوز میکروفون را برای این سایت فعال کنید.';
			}
			if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
				return 'میکروفونی یافت نشد. میکروفون را وصل کنید و دوباره تلاش کنید.';
			}
			if (err.name === 'NotReadableError') {
				return 'میکروفون در حال استفاده است. برنامه دیگری که از میکروفون استفاده می‌کند را ببندید.';
			}
			if (err.name === 'NotSupportedError') {
				return 'مرورگر شما ضبط صدا را پشتیبانی نمی‌کند.';
			}
		}
		return 'خطا در دسترسی به میکروفون. مجوز ضبط را بررسی کنید.';
	}

	async function startRecording() {
		error = '';
		revokePreview();

		if (!canRecord) {
			error =
				'ضبط صدا فقط روی HTTPS یا localhost ممکن است. از Chrome یا Edge روی دسکتاپ استفاده کنید.';
			return;
		}

		try {
			stopStream();
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true
				}
			});
			activeStream = stream;

			const mediaRecorder = createMediaRecorder(stream);
			chunks = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) chunks.push(event.data);
			};

			mediaRecorder.onerror = () => {
				error = 'خطا در حین ضبط صدا. دوباره تلاش کنید.';
				recording = false;
				stopStream();
				recorder = null;
			};

			mediaRecorder.onstop = () => {
				stopStream();
				const mimeType = mediaRecorder.mimeType || 'audio/webm';
				const blob = new Blob(chunks, { type: mimeType });
				if (blob.size > 0) {
					clips = [...clips, blob];
					previewUrl = URL.createObjectURL(blob);
				} else {
					error = 'فایل صوتی خالی بود. دوباره ضبط کنید.';
				}
				recorder = null;
				recording = false;
			};

			recorder = mediaRecorder;
			mediaRecorder.start(250);
			recording = true;
		} catch (err: unknown) {
			stopStream();
			recorder = null;
			recording = false;
			error = micErrorMessage(err);
		}
	}

	function stopRecording() {
		if (recorder && recorder.state !== 'inactive') {
			recorder.stop();
		}
	}

	function removeClip(index: number) {
		const removingLast = index === clips.length - 1;
		clips = clips.filter((_, i) => i !== index);
		if (removingLast) revokePreview();
	}

	$effect(() => {
		return () => {
			if (recorder && recorder.state !== 'inactive') {
				recorder.stop();
			}
			stopStream();
			revokePreview();
		};
	});
</script>

<div class="rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3">
	<div class="flex flex-wrap items-center gap-2">
		{#if recording}
			<Button
				type="button"
				size="sm"
				variant="destructive"
				class="h-8 rounded-lg text-xs"
				onclick={stopRecording}
			>
				<Square class="ms-1 h-3.5 w-3.5" />
				توقف ضبط
			</Button>
			<span class="inline-flex items-center gap-1.5 text-xs text-destructive">
				<span class="h-2 w-2 animate-pulse rounded-full bg-destructive"></span>
				در حال ضبط...
			</span>
		{:else}
			<Button
				type="button"
				size="sm"
				variant="outline"
				class="h-8 rounded-lg text-xs transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
				disabled={!canRecord}
				onclick={startRecording}
			>
				<Mic class="ms-1 h-3.5 w-3.5" />
				شروع ضبط
			</Button>
		{/if}
	</div>

	{#if !canRecord}
		<p class="mt-2 text-[11px] text-muted-foreground">
			برای ضبط صدا از Chrome/Edge روی localhost یا HTTPS استفاده کنید.
		</p>
	{/if}

	{#if error}
		<p class="mt-2 text-xs text-destructive">{error}</p>
	{/if}

	{#if previewUrl}
		<audio class="mt-2 w-full" controls src={previewUrl}>
			<track kind="captions" />
		</audio>
	{/if}

	{#if clips.length}
		<ul class="mt-2 space-y-1.5">
			{#each clips as _, index (index)}
				<li class="flex items-center justify-between rounded-lg bg-background px-2.5 py-1.5 text-xs">
					<span>فایل صوتی {index + 1}</span>
					<button
						type="button"
						class="rounded-md p-1 text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
						aria-label="حذف فایل صوتی"
						onclick={() => removeClip(index)}
					>
						<Trash2 class="h-3.5 w-3.5" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
