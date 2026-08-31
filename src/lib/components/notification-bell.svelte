<script lang="ts">
	import { goto } from '$app/navigation';
	import { Popover } from 'bits-ui';
	import {
		Bell,
		CheckCheck,
		LoaderCircle,
		CalendarPlus,
		CalendarX,
		CalendarClock,
		Info,
		ArrowLeft
	} from '@lucide/svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import { cn } from '$lib/utils';
	import {
		getNotifications,
		getUnreadCount,
		isNotificationsLoading,
		readAllNotifications,
		readNotification,
		refreshNotifications
	} from '$lib/notifications/notifications.svelte';
	import {
		disablePushNotifications,
		enablePushNotifications,
		isPushConfigured,
		isPushLoading,
		isPushSubscribed,
		getPushSupported as isPushSupported
	} from '$lib/push/push.svelte';
	import type { NotificationRecord, NotificationType } from '$lib/notifications/types';
	import {
		loadNotificationContext,
		notificationDestinationLabel,
		type NotificationContext
	} from '$lib/notifications/services/notification-context';
	import { formatFaDateTime } from '$lib/date';
	import { pb } from '$lib/pocketbase';

	let { class: className = '' }: { class?: string } = $props();

	let open = $state(false);
	let detailOpen = $state(false);
	let selected = $state<NotificationRecord | null>(null);
	let context = $state<NotificationContext | null>(null);
	let contextLoading = $state(false);

	const items = $derived(getNotifications());
	const loading = $derived(isNotificationsLoading());
	const unread = $derived(getUnreadCount());
	const selectedMeta = $derived(selected ? typeMeta(selected.type) : null);
	const destinationLabel = $derived(
		selected ? notificationDestinationLabel(selected.href) : 'بستن'
	);
	const pushSupported = $derived(isPushSupported());
	const pushConfigured = $derived(isPushConfigured());
	const pushSubscribed = $derived(isPushSubscribed());
	const pushLoading = $derived(isPushLoading());

	async function togglePushFromBell() {
		if (pushSubscribed) {
			await disablePushNotifications();
		} else {
			await enablePushNotifications();
		}
	}

	$effect(() => {
		if (open) void refreshNotifications();
	});

	async function handleItemClick(item: NotificationRecord) {
		if (!item.readAt) await readNotification(item.id);
		selected = item;
		context = null;
		contextLoading = Boolean(item.metadata?.appointmentId);
		detailOpen = true;
		open = false;

		const appointmentId = item.metadata?.appointmentId;
		if (appointmentId && pb.authStore.token) {
			try {
				context = await loadNotificationContext(String(appointmentId), pb.authStore.token);
			} finally {
				contextLoading = false;
			}
		}
	}

	async function handleReadAll() {
		await readAllNotifications();
	}

	function handleGoToPage() {
		if (!selected?.href) {
			detailOpen = false;
			return;
		}
		detailOpen = false;
		goto(selected.href);
	}

	function closeDetail() {
		detailOpen = false;
	}

	function typeMeta(type: NotificationType) {
		switch (type) {
			case 'appointment_created':
				return {
					label: 'ثبت نوبت',
					icon: CalendarPlus,
					tone: 'text-emerald-600 bg-emerald-500/10'
				};
			case 'appointment_cancelled':
				return {
					label: 'لغو نوبت',
					icon: CalendarX,
					tone: 'text-rose-600 bg-rose-500/10'
				};
			case 'appointment_rescheduled':
				return {
					label: 'تغییر زمان',
					icon: CalendarClock,
					tone: 'text-sky-600 bg-sky-500/10'
				};
			default:
				return { label: 'سیستم', icon: Info, tone: 'text-muted-foreground bg-muted' };
		}
	}

	function formatWhen(created: string): string {
		if (!created) return '';
		try {
			return formatFaDateTime(new Date(created));
		} catch {
			return '';
		}
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class={cn(
			'relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
			className
		)}
		aria-label="اعلان‌ها"
	>
		<Bell class="h-[18px] w-[18px]" />
		{#if unread > 0}
			<span
				class="absolute end-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background"
				aria-hidden="true"
			>
				{unread > 9 ? '۹+' : unread.toLocaleString('fa-IR')}
			</span>
		{/if}
	</Popover.Trigger>

	<Popover.Portal>
		<Popover.Content
			align="end"
			sideOffset={10}
			class="z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border/70 bg-popover/95 text-popover-foreground shadow-xl outline-none backdrop-blur-md"
		>
			<div class="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-3">
				<h2 class="text-sm font-semibold">اعلان‌ها</h2>
				{#if unread > 0}
					<Button
						variant="ghost"
						size="sm"
						class="h-8 gap-1 rounded-lg px-2 text-xs text-muted-foreground"
						onclick={handleReadAll}
					>
						<CheckCheck class="h-3.5 w-3.5" />
						همه خوانده
					</Button>
				{/if}
			</div>

			{#if pushSupported && pushConfigured}
				<div class="border-t border-border/50 px-4 py-2.5">
					<button
						type="button"
						class="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-accent/50"
						disabled={pushLoading}
						onclick={togglePushFromBell}
					>
						<span class="text-muted-foreground">
							{pushSubscribed ? 'اعلان push فعال است' : 'فعال‌سازی push (خارج از سایت)'}
						</span>
						<span
							class={cn(
								'rounded-full px-2 py-0.5 text-[10px] font-medium',
								pushSubscribed ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'
							)}
						>
							{pushSubscribed ? 'روشن' : 'خاموش'}
						</span>
					</button>
				</div>
			{/if}

			<div class="max-h-[min(24rem,60dvh)] overflow-y-auto">
				{#if loading && !items.length}
					<div class="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
						<LoaderCircle class="h-4 w-4 animate-spin" />
						در حال بارگذاری...
					</div>
				{:else if !items.length}
					<div class="px-4 py-10 text-center text-sm text-muted-foreground">اعلانی ندارید</div>
				{:else}
					<ul class="divide-y divide-border/40">
						{#each items as item (item.id)}
							<li>
								<button
									type="button"
									class={cn(
										'flex w-full flex-col gap-1 px-4 py-3 text-right transition-colors duration-200 ease-in-out hover:bg-accent/50',
										!item.readAt && 'bg-primary/5'
									)}
									onclick={() => handleItemClick(item)}
								>
									<div class="flex items-start justify-between gap-2">
										<p class="text-sm font-medium leading-snug text-foreground">{item.title}</p>
										{#if !item.readAt}
											<span
												class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
												aria-hidden="true"
											></span>
										{/if}
									</div>
									{#if item.body}
										<p class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
											{item.body}
										</p>
									{/if}
									<p class="text-[10px] tabular-nums text-muted-foreground/80">
										{formatWhen(item.created)}
									</p>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>

<Dialog bind:open={detailOpen}>
	{#if selected && selectedMeta}
		{@const Icon = selectedMeta.icon}
		<div class="space-y-4">
			<div class="flex items-start gap-3">
				<span
					class={cn(
						'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
						selectedMeta.tone
					)}
				>
					<Icon class="h-5 w-5" />
				</span>
				<div class="min-w-0 flex-1 space-y-1 text-right">
					<p class="text-xs font-medium text-muted-foreground">{selectedMeta.label}</p>
					<h2 class="text-base font-semibold leading-snug text-foreground">{selected.title}</h2>
					<p class="text-xs tabular-nums text-muted-foreground">{formatWhen(selected.created)}</p>
				</div>
			</div>

			{#if contextLoading}
				<div
					class="flex items-center justify-center gap-2 rounded-xl border border-border/60 px-3 py-6 text-sm text-muted-foreground"
				>
					<LoaderCircle class="h-4 w-4 animate-spin" />
					در حال بارگذاری جزئیات...
				</div>
			{:else if context}
				<dl class="grid gap-2 rounded-xl border border-border/60 bg-card/50 p-3 text-sm">
					<div class="flex items-center justify-between gap-3">
						<dt class="text-muted-foreground">مراجع</dt>
						<dd class="font-medium text-foreground">{context.patientName}</dd>
					</div>
					<div class="flex items-center justify-between gap-3">
						<dt class="text-muted-foreground">متخصص</dt>
						<dd class="font-medium text-foreground">{context.doctorName}</dd>
					</div>
					<div class="flex items-center justify-between gap-3">
						<dt class="text-muted-foreground">تخصص</dt>
						<dd class="text-foreground">{context.specialty}</dd>
					</div>
					<div class="flex items-center justify-between gap-3">
						<dt class="text-muted-foreground">زمان نوبت</dt>
						<dd class="tabular-nums text-foreground">{context.dateTimeLabel}</dd>
					</div>
					<div class="flex items-center justify-between gap-3">
						<dt class="text-muted-foreground">نوع</dt>
						<dd class="text-foreground">{context.typeLabel}</dd>
					</div>
					<div class="flex items-center justify-between gap-3">
						<dt class="text-muted-foreground">وضعیت</dt>
						<dd class="font-medium text-foreground">{context.statusLabel}</dd>
					</div>
				</dl>
			{/if}

			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button variant="outline" class="rounded-xl" onclick={closeDetail}>بستن</Button>
				{#if selected.href}
					<Button class="gap-1.5 rounded-xl" onclick={handleGoToPage}>
						<ArrowLeft class="h-4 w-4" />
						{destinationLabel}
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</Dialog>
