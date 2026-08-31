<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { Popover } from 'bits-ui';
	import {
		Bell,
		CheckCheck,
		LoaderCircle,
		ArrowLeft
	} from '@lucide/svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Sheet from '$lib/components/ui/sheet.svelte';
	import { cn } from '$lib/utils';
	import {
		getNotifications,
		getUnreadCount,
		getBellAttention,
		isNotificationsLoading,
		readAllNotifications,
		readNotification,
		refreshNotifications,
		clearBellAttention
	} from '$lib/notifications/notifications.svelte';
	import type { NotificationRecord } from '$lib/notifications/types';
	import {
		loadNotificationContext,
		notificationDestinationLabel,
		type NotificationContext
	} from '$lib/notifications/services/notification-context';
	import { notificationTypeMeta, resolveNotificationHref } from '$lib/notifications/notification-meta';
	import { formatRelativeFa } from '$lib/date';
	import { pb } from '$lib/pocketbase';
	import {
		disablePushNotifications,
		enablePushNotifications,
		isPushConfigured,
		isPushLoading,
		isPushSubscribed,
		getPushSupported as isPushSupported
	} from '$lib/push/push.svelte';

	let { class: className = '' }: { class?: string } = $props();

	let open = $state(false);
	let isMobile = $state(false);
	let detailOpen = $state(false);
	let selected = $state<NotificationRecord | null>(null);
	let context = $state<NotificationContext | null>(null);
	let contextLoading = $state(false);

	const items = $derived(getNotifications());
	const loading = $derived(isNotificationsLoading());
	const unread = $derived(getUnreadCount());
	const bellAttention = $derived(getBellAttention());
	const selectedMeta = $derived(selected ? notificationTypeMeta(selected.type) : null);
	const destinationLabel = $derived(
		selected ? notificationDestinationLabel(selected.href) : 'بستن'
	);
	const pushSupported = $derived(isPushSupported());
	const pushConfigured = $derived(isPushConfigured());
	const pushSubscribed = $derived(isPushSubscribed());
	const pushLoading = $derived(isPushLoading());

	const bellTriggerClass = $derived(
		cn(
			'relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 ease-in-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
			unread > 0 || bellAttention
				? 'text-primary hover:text-primary'
				: 'text-muted-foreground hover:text-foreground',
			className
		)
	);

	$effect(() => {
		if (!browser) return;
		const mq = window.matchMedia('(max-width: 767px)');
		const sync = () => {
			isMobile = mq.matches;
		};
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	async function togglePushFromBell() {
		if (pushSubscribed) {
			await disablePushNotifications();
		} else {
			await enablePushNotifications();
		}
	}

	$effect(() => {
		if (open) {
			clearBellAttention();
			void refreshNotifications();
		}
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
		if (!selected) {
			detailOpen = false;
			return;
		}
		detailOpen = false;
		const href = resolveNotificationHref(selected);
		if (href) goto(href);
	}

	function closeDetail() {
		detailOpen = false;
	}

	function formatWhen(created: string): string {
		if (!created) return '';
		return formatRelativeFa(created);
	}

	function openPanel() {
		open = true;
	}
</script>

{#snippet bellIcon()}
	{#if bellAttention}
		<span
			class="absolute inset-0 animate-ping rounded-full bg-primary/30"
			aria-hidden="true"
		></span>
	{:else if unread > 0}
		<span
			class="absolute -inset-0.5 rounded-full ring-2 ring-primary/35"
			aria-hidden="true"
		></span>
	{/if}
	<Bell class={cn('relative h-[18px] w-[18px]', bellAttention && 'animate-bounce')} />
	{#if unread > 0}
		<span
			class="absolute end-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background"
			aria-hidden="true"
		>
			{unread > 9 ? '۹+' : unread.toLocaleString('fa-IR')}
		</span>
	{/if}
{/snippet}

{#snippet pushToggleRow()}
	{#if pushSupported && pushConfigured}
		<div class="border-b border-border/50 px-3 py-2.5 sm:px-4">
			<button
				type="button"
				class="flex w-full flex-col items-stretch gap-2 rounded-lg px-2 py-2 text-xs transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between"
				disabled={pushLoading}
				onclick={togglePushFromBell}
			>
				<span class="min-w-0 text-right leading-relaxed text-muted-foreground">
					{pushSubscribed ? 'اعلان مرورگر فعال است' : 'فعال‌سازی اعلان مرورگر'}
				</span>
				<span
					class={cn(
						'shrink-0 self-end rounded-full px-2.5 py-1 text-[10px] font-medium sm:self-auto',
						pushSubscribed ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'
					)}
				>
					{pushSubscribed ? 'روشن' : 'خاموش'}
				</span>
			</button>
		</div>
	{/if}
{/snippet}

{#snippet notificationList(desktopScroll = false)}
	<div
		class={cn(
			'overscroll-contain',
			desktopScroll ? 'max-h-[min(24rem,60dvh)] overflow-y-auto p-2' : 'p-0'
		)}
		dir="rtl"
	>
		{#if loading && !items.length}
			<div class="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
				<LoaderCircle class="h-4 w-4 animate-spin" />
				در حال بارگذاری...
			</div>
		{:else if !items.length}
			<div class="px-4 py-10 text-center text-sm text-muted-foreground">اعلانی ندارید</div>
		{:else}
			<ul class="space-y-2">
				{#each items as item (item.id)}
					{@const meta = notificationTypeMeta(item.type)}
					{@const Icon = meta.icon}
					<li>
						<button
							type="button"
							dir="rtl"
							class={cn(
								'flex w-full items-start gap-2.5 rounded-xl border px-3 py-3 text-right transition-all duration-200 ease-in-out active:scale-[0.99] sm:gap-3 sm:hover:-translate-y-px sm:hover:shadow-sm',
								meta.accent,
								!item.readAt
									? 'border-primary/30 bg-primary/[0.06] shadow-sm'
									: 'border-border/50 bg-card/60'
							)}
							onclick={() => handleItemClick(item)}
						>
							<span
								class={cn(
									'order-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
									meta.tone
								)}
							>
								<Icon class="h-4 w-4" />
							</span>
							<div class="order-2 min-w-0 flex-1 space-y-1">
								<div class="flex items-start gap-2">
									{#if !item.readAt}
										<span
											class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
											aria-hidden="true"
										></span>
									{/if}
									<p class="min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-foreground">
										{item.title}
									</p>
								</div>
								{#if item.body}
									<p class="line-clamp-3 break-words text-xs leading-relaxed text-muted-foreground">
										{item.body}
									</p>
								{/if}
								<div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-0.5">
									<span class="text-[10px] font-medium text-muted-foreground/90">
										{meta.label}
									</span>
									<p class="text-[10px] tabular-nums text-muted-foreground/80">
										{formatWhen(item.created)}
									</p>
								</div>
							</div>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/snippet}

{#if isMobile}
	<button type="button" class={bellTriggerClass} aria-label="اعلان‌ها" onclick={openPanel}>
		{@render bellIcon()}
	</button>

	<Sheet bind:open title="اعلان‌ها" class="max-h-[88dvh]">
		<div class="flex min-h-0 flex-1 flex-col" dir="rtl">
			{#if unread > 0}
				<div class="mb-3 flex justify-end">
					<Button
						variant="ghost"
						size="sm"
						class="h-9 gap-1 rounded-lg px-2 text-xs text-muted-foreground"
						onclick={handleReadAll}
					>
						<CheckCheck class="h-3.5 w-3.5" />
						همه خوانده
					</Button>
				</div>
			{/if}
			{@render pushToggleRow()}
			{@render notificationList()}
		</div>
	</Sheet>
{:else}
	<Popover.Root bind:open>
		<Popover.Trigger class={bellTriggerClass} aria-label="اعلان‌ها">
			{@render bellIcon()}
		</Popover.Trigger>

		<Popover.Portal>
			<Popover.Content
				align="end"
				side="bottom"
				sideOffset={10}
				collisionPadding={12}
				dir="rtl"
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

				{@render pushToggleRow()}
				{@render notificationList(true)}
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
{/if}

<Dialog bind:open={detailOpen}>
	{#if selected && selectedMeta}
		{@const Icon = selectedMeta.icon}
		<div class="space-y-4" dir="rtl">
			<div
				class={cn(
					'overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-4',
					selectedMeta.accent
				)}
			>
				<div class="flex items-start gap-3">
					<span
						class={cn(
							'order-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1',
							selectedMeta.tone
						)}
					>
						<Icon class="h-5 w-5" />
					</span>
					<div class="order-2 min-w-0 flex-1 space-y-1 text-right">
						<p class="text-xs font-medium text-muted-foreground">{selectedMeta.label}</p>
						<h2 class="text-base font-semibold leading-snug text-foreground">{selected.title}</h2>
						<p class="text-xs tabular-nums text-muted-foreground">{formatRelativeFa(selected.created)}</p>
					</div>
				</div>
				{#if selected.body}
					<p class="mt-3 break-words rounded-xl bg-background/70 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
						{selected.body}
					</p>
				{/if}
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
