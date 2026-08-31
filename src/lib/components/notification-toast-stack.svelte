<script lang="ts">
	import { goto } from '$app/navigation';
	import { X, ArrowLeft } from '@lucide/svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { cn } from '$lib/utils';
	import { formatRelativeFa } from '$lib/date';
	import {
		dismissNotificationToast,
		getNotificationToasts,
		readNotification
	} from '$lib/notifications/notifications.svelte';
	import {
		notificationTypeMeta,
		resolveNotificationHref
	} from '$lib/notifications/notification-meta';

	const toasts = $derived(getNotificationToasts());
	const timers = new Map<string, ReturnType<typeof setTimeout>>();

	$effect(() => {
		for (const toast of toasts) {
			if (timers.has(toast.id)) continue;
			const ms = toast.priority === 'urgent' ? 20_000 : 12_000;
			const timer = setTimeout(() => dismissNotificationToast(toast.id), ms);
			timers.set(toast.id, timer);
		}

		for (const [id, timer] of timers) {
			if (!toasts.some((t) => t.id === id)) {
				clearTimeout(timer);
				timers.delete(id);
			}
		}
	});

	async function openToast(id: string, href: string | null) {
		await readNotification(id);
		dismissNotificationToast(id);
		if (href) goto(href);
	}

	function closeToast(id: string) {
		dismissNotificationToast(id);
	}
</script>

{#if toasts.length}
	<div
		class="pointer-events-none fixed z-[45] flex flex-col gap-2.5
			top-[4.5rem] inset-x-3 max-w-none
			md:top-auto md:bottom-6 md:inset-x-auto md:right-3 md:w-48 md:flex-col-reverse"
		dir="rtl"
		aria-live="assertive"
		aria-label="اعلان‌های جدید"
	>
		{#each toasts as toast (toast.id)}
			{@const meta = notificationTypeMeta(toast.type)}
			{@const Icon = meta.icon}
			{@const href = resolveNotificationHref(toast)}
			<div
				class={cn(
					'pointer-events-auto overflow-hidden rounded-2xl border-2 bg-card shadow-lg',
					toast.priority === 'urgent'
						? 'border-rose-500 bg-rose-50 dark:bg-rose-950/90'
						: 'border-border bg-card'
				)}
				role="alert"
			>
				<div class="flex items-start gap-3 p-3.5">
					<span
						class={cn(
							'order-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
							meta.tone,
							toast.priority === 'urgent' && 'animate-pulse'
						)}
					>
						<Icon class="h-5 w-5" />
					</span>

					<div class="order-2 min-w-0 flex-1 space-y-1.5 text-right">
						<div class="flex items-start gap-2">
							<button
								type="button"
								class="order-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
								aria-label="بستن"
								onclick={() => closeToast(toast.id)}
							>
								<X class="h-4 w-4" />
							</button>
							<div class="order-1 min-w-0 flex-1">
								<p class="text-[11px] font-semibold text-primary">{meta.label}</p>
								<p class="text-sm font-bold leading-snug text-foreground">{toast.title}</p>
							</div>
						</div>

						{#if toast.body}
							<p class="line-clamp-3 text-xs leading-relaxed text-foreground/85">{toast.body}</p>
						{/if}

						<div class="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
							<span class="text-[10px] font-medium tabular-nums text-muted-foreground">
								{formatRelativeFa(toast.created)}
							</span>
							{#if href}
								<Button
									size="sm"
									class="h-7 rounded-lg px-2.5 text-[11px]"
									onclick={() => openToast(toast.id, href)}
								>
									<ArrowLeft class="ml-1 h-3.5 w-3.5" />
									مشاهده
								</Button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
