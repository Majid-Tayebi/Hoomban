<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import {
		disablePushNotifications,
		enablePushNotifications,
		getPushError,
		getPushPermission,
		isPushConfigured,
		isPushLoading,
		isPushSubscribed,
		getPushSupported as isPushSupported,
		refreshPushNotifications,
		sendTestPush
	} from '$lib/push/push.svelte';
	import { pb } from '$lib/pocketbase';
	import { BellRing, LoaderCircle, Send } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let testing = $state(false);
	let testMessage = $state('');

	const supported = $derived(isPushSupported());
	const configured = $derived(isPushConfigured());
	const subscribed = $derived(isPushSubscribed());
	const permission = $derived(getPushPermission());
	const loading = $derived(isPushLoading());
	const error = $derived(getPushError());

	onMount(() => {
		void refreshPushNotifications();
	});

	async function togglePush() {
		if (subscribed) {
			await disablePushNotifications();
		} else {
			await enablePushNotifications();
		}
	}

	async function handleTest() {
		if (!pb.authStore.token) return;
		testing = true;
		testMessage = '';
		try {
			const result = await sendTestPush(pb.authStore.token);
			testMessage = `ارسال شد: ${result.sent.toLocaleString('fa-IR')}`;
		} catch (err) {
			testMessage = err instanceof Error ? err.message : 'خطا در تست';
		} finally {
			testing = false;
		}
	}
</script>

<div class="rounded-2xl border border-border/70 bg-card/50 p-4">
	<div class="flex items-start gap-3">
		<span
			class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
		>
			<BellRing class="h-5 w-5" />
		</span>
		<div class="min-w-0 flex-1 space-y-3 text-right">
			<div>
				<h3 class="text-sm font-semibold">اعلان Web Push (PWA)</h3>
				<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
					دریافت اعلان نوبت و رویدادها حتی وقتی تب مرورگر بسته است.
				</p>
			</div>

			{#if !supported}
				<p class="text-xs text-muted-foreground">مرورگر شما از Web Push پشتیبانی نمی‌کند.</p>
			{:else if !configured}
				<p class="text-xs text-amber-700 dark:text-amber-400">
					Web Push روی سرور پیکربندی نشده (VAPID keys).
				</p>
			{:else}
				<p class="text-xs text-muted-foreground">
					وضعیت: {subscribed ? 'فعال' : permission === 'denied' ? 'مسدود توسط مرورگر' : 'غیرفعال'}
				</p>
				{#if error}
					<p class="text-xs text-destructive">{error}</p>
				{/if}
				{#if testMessage}
					<p class="text-xs text-emerald-700 dark:text-emerald-400">{testMessage}</p>
				{/if}
				<div class="flex flex-wrap justify-end gap-2">
					{#if subscribed}
						<Button
							variant="outline"
							size="sm"
							class="gap-1.5 rounded-xl"
							disabled={loading || testing}
							onclick={handleTest}
						>
							{#if testing}
								<LoaderCircle class="h-4 w-4 animate-spin" />
							{:else}
								<Send class="h-4 w-4" />
							{/if}
							تست اعلان
						</Button>
					{/if}
					<Button
						size="sm"
						class="rounded-xl"
						variant={subscribed ? 'outline' : 'default'}
						disabled={loading || permission === 'denied'}
						onclick={togglePush}
					>
						{#if loading}
							<LoaderCircle class="ml-1.5 h-4 w-4 animate-spin" />
						{/if}
						{subscribed ? 'غیرفعال‌سازی' : 'فعال‌سازی push'}
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>
