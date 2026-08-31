<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import {
		enablePushNotifications,
		getPushError,
		hidePushPrompt,
		isPushConfigured,
		isPushLoading,
		isPushPromptVisible,
		getPushSupported as isPushSupported
	} from '$lib/push/push.svelte';
	import { BellRing, X } from '@lucide/svelte';

	let enabling = $state(false);

	const visible = $derived(isPushPromptVisible());
	const supported = $derived(isPushSupported());
	const configured = $derived(isPushConfigured());
	const loading = $derived(isPushLoading() || enabling);
	const error = $derived(getPushError());

	async function handleEnable() {
		enabling = true;
		await enablePushNotifications();
		enabling = false;
	}
</script>

{#if visible && supported && configured}
	<div
		class="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] start-4 end-4 z-[60] mx-auto max-w-md rounded-2xl border border-border/70 bg-popover/95 p-4 text-popover-foreground shadow-xl backdrop-blur-md sm:bottom-6 sm:start-auto sm:end-6"
		role="region"
		aria-label="فعال‌سازی اعلان push"
	>
		<div class="flex items-start gap-3">
			<span
				class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
			>
				<BellRing class="h-5 w-5" />
			</span>
			<div class="min-w-0 flex-1 space-y-2 text-right">
				<p class="text-sm font-semibold">اعلان حتی وقتی سایت بسته است</p>
				<p class="text-xs leading-relaxed text-muted-foreground">
					با فعال‌سازی Web Push، نوبت‌ها و رویدادهای مهم را حتی خارج از پنل دریافت کنید.
				</p>
				{#if error}
					<p class="text-xs text-destructive">{error}</p>
				{/if}
				<div class="flex flex-wrap justify-end gap-2 pt-1">
					<Button variant="ghost" size="sm" class="rounded-xl" disabled={loading} onclick={hidePushPrompt}>
						بعداً
					</Button>
					<Button size="sm" class="rounded-xl" disabled={loading} onclick={handleEnable}>
						{loading ? 'در حال فعال‌سازی…' : 'فعال‌سازی'}
					</Button>
				</div>
			</div>
			<button
				type="button"
				class="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-label="بستن"
				onclick={hidePushPrompt}
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	</div>
{/if}
