<script lang="ts">
	import { pb } from '$lib/pocketbase';
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import { LoaderCircle } from '@lucide/svelte';

	let {
		open = $bindable(false),
		appointmentId = null,
		onSubmitted
	}: {
		open?: boolean;
		appointmentId?: string | null;
		onSubmitted?: () => void;
	} = $props();

	let message = $state('');
	let submitting = $state(false);
	let error = $state('');
	let success = $state(false);

	$effect(() => {
		if (!open) {
			message = '';
			error = '';
			success = false;
			submitting = false;
		}
	});

	async function submit() {
		if (!pb.authStore.token) {
			error = 'لطفاً دوباره وارد شوید';
			return;
		}
		submitting = true;
		error = '';
		try {
			const res = await fetch('/api/patient-requests', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${pb.authStore.token}`
				},
				body: JSON.stringify({
					message,
					appointmentId: appointmentId || undefined,
					category: 'appointment_cancel'
				})
			});
			const data = (await res.json()) as { error?: string };
			if (!res.ok) throw new Error(data.error || 'ثبت درخواست ناموفق بود');
			success = true;
			onSubmitted?.();
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'ثبت درخواست ناموفق بود';
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog bind:open class="max-w-md">
	<div class="space-y-4 text-right">
		<div>
			<h3 class="text-base font-semibold">ثبت درخواست لغو نوبت</h3>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				درخواست شما برای منشی کلینیک ارسال می‌شود. لطفاً دلیل یا توضیحات لازم را بنویسید.
			</p>
		</div>

		{#if success}
			<p class="rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
				درخواست شما ثبت شد. منشی در اسرع وقت پیگیری می‌کند.
			</p>
		{:else}
			<textarea
				class="min-h-[7rem] w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
				placeholder="مثلاً: به دلیل مشکل کاری نمی‌توانم در این زمان حضور داشته باشم..."
				bind:value={message}
				disabled={submitting}
			></textarea>
			{#if error}
				<p class="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
			{/if}
		{/if}

		<div class="flex flex-wrap justify-end gap-2">
			<Button
				variant="ghost"
				size="sm"
				class="rounded-xl"
				disabled={submitting}
				onclick={() => {
					open = false;
				}}
			>
				{success ? 'بستن' : 'انصراف'}
			</Button>
			{#if !success}
				<Button
					size="sm"
					class="rounded-xl"
					disabled={submitting || message.trim().length < 10}
					onclick={submit}
				>
					{#if submitting}
						<LoaderCircle class="ml-1.5 h-4 w-4 animate-spin" />
					{/if}
					ارسال درخواست
				</Button>
			{/if}
		</div>
	</div>
</Dialog>
