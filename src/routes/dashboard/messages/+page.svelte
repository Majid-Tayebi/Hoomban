<script lang="ts">
	import { getUser, isAuthHydrated } from '$lib/auth.svelte';
	import {
		filterThreads,
		loadMessageThreads,
		loadMessageRecipients,
		sendMessage,
		markMessageRead,
		toggleMessageStar,
		type MessageRecipient
	} from '$lib/messages';
	import type { MessageThread } from '$lib/messages/types';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import { Inbox, Send, Star, Search, PenSquare } from '@lucide/svelte';

	let folder = $state<'inbox' | 'sent' | 'starred'>('inbox');
	let query = $state('');
	let threads = $state<MessageThread[]>([]);
	let selectedId = $state<string | null>(null);
	let loading = $state(true);
	let toast = $state('');
	let composeOpen = $state(false);
	let sending = $state(false);
	let recipients = $state<MessageRecipient[]>([]);

	let compose = $state({
		recipientId: '',
		subject: '',
		body: ''
	});

	const user = $derived(getUser());
	const hydrated = $derived(isAuthHydrated());
	const filtered = $derived(filterThreads(threads, folder, query));
	const selected = $derived(threads.find((t) => t.id === selectedId) ?? filtered[0] ?? null);
	const unreadCount = $derived(threads.filter((t) => t.folder === 'inbox' && t.unread).length);

	$effect(() => {
		if (!hydrated || !user?.id) return;
		loading = true;
		void loadMessageThreads(user)
			.then((rows) => {
				threads = rows;
				if (!selectedId && rows[0]) selectedId = rows[0].id;
			})
			.finally(() => {
				loading = false;
			});
	});

	function showToast(msg: string) {
		toast = msg;
		setTimeout(() => (toast = ''), 3000);
	}

	async function select(id: string) {
		selectedId = id;
		const thread = threads.find((t) => t.id === id);
		if (thread?.unread && user?.id !== 'demo-user') {
			threads = threads.map((t) => (t.id === id ? { ...t, unread: false } : t));
			try {
				await markMessageRead(id);
			} catch {
				/* best effort */
			}
		} else {
			threads = threads.map((t) => (t.id === id ? { ...t, unread: false } : t));
		}
	}

	async function onToggleStar(id: string) {
		const current = threads.find((t) => t.id === id);
		if (!current) return;
		const next = !current.starred;
		threads = threads.map((t) => (t.id === id ? { ...t, starred: next } : t));
		if (user?.id !== 'demo-user') {
			try {
				await toggleMessageStar(id, next);
			} catch {
				threads = threads.map((t) => (t.id === id ? { ...t, starred: !next } : t));
			}
		}
	}

	async function openCompose() {
		composeOpen = true;
		try {
			recipients = await loadMessageRecipients();
			if (recipients[0] && !compose.recipientId) {
				compose.recipientId = recipients[0].id;
			}
		} catch (err: unknown) {
			showToast(err instanceof Error ? err.message : 'بارگذاری گیرندگان ناموفق بود');
		}
	}

	async function onSendMessage() {
		if (!compose.recipientId || !compose.subject.trim() || !compose.body.trim()) {
			showToast('گیرنده، موضوع و متن الزامی است');
			return;
		}
		sending = true;
		try {
			const thread = await sendMessage({
				recipientId: compose.recipientId,
				subject: compose.subject.trim(),
				body: compose.body.trim()
			});
			threads = [thread, ...threads];
			selectedId = thread.id;
			folder = 'sent';
			composeOpen = false;
			compose = { recipientId: recipients[0]?.id ?? '', subject: '', body: '' };
			showToast('پیام ارسال شد');
		} catch (err: unknown) {
			showToast(err instanceof Error ? err.message : 'ارسال ناموفق بود');
		} finally {
			sending = false;
		}
	}

	const folders = [
		{ id: 'inbox' as const, label: 'ورودی', icon: Inbox },
		{ id: 'sent' as const, label: 'ارسال‌شده', icon: Send },
		{ id: 'starred' as const, label: 'ستاره‌دار', icon: Star }
	];
</script>

<header class="mb-5 flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="text-xl font-bold tracking-tight sm:text-2xl">پیام‌ها</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			صندوق داخلی کلینیک
			{#if unreadCount}
				— {unreadCount.toLocaleString('fa-IR')} خوانده‌نشده
			{/if}
		</p>
	</div>
	<Button class="h-10 rounded-xl" onclick={openCompose}>
		<PenSquare class="ml-1.5 h-4 w-4" />
		پیام جدید
	</Button>
</header>

{#if toast}
	<p class="mb-4 rounded-xl bg-accent/70 px-3 py-2 text-sm">{toast}</p>
{/if}

<div class="grid grid-cols-1 gap-4 xl:grid-cols-[220px_1fr_1.1fr]">
	<Card class="h-fit rounded-2xl border-border/50 shadow-sm">
		<CardContent class="space-y-1 p-3">
			{#each folders as f}
				{@const Icon = f.icon}
				<button
					type="button"
					class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors
						{folder === f.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
					onclick={() => (folder = f.id)}
				>
					<Icon class="h-4 w-4" />
					{f.label}
				</button>
			{/each}
		</CardContent>
	</Card>

	<Card class="rounded-2xl border-border/50 shadow-sm">
		<CardContent class="space-y-3 p-3 sm:p-4">
			<div class="relative">
				<Search class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input class="h-10 rounded-xl pr-10" placeholder="جستجوی پیام..." bind:value={query} />
			</div>
			{#if loading}
				<p class="py-10 text-center text-sm text-muted-foreground">در حال بارگذاری...</p>
			{:else if filtered.length === 0}
				<p class="py-10 text-center text-sm text-muted-foreground">پیامی نیست.</p>
			{:else}
				<ul class="max-h-[60vh] space-y-1 overflow-y-auto">
					{#each filtered as t (t.id)}
						<li>
							<button
								type="button"
								class="w-full rounded-xl px-3 py-3 text-right transition-colors
									{selected?.id === t.id ? 'bg-primary/10 ring-1 ring-primary/25' : 'hover:bg-muted/70'}"
								onclick={() => select(t.id)}
							>
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0">
										<p class="truncate text-sm {t.unread ? 'font-bold' : 'font-medium'}">{t.from}</p>
										<p class="truncate text-xs text-muted-foreground">{t.role}</p>
									</div>
									<span class="shrink-0 text-[10px] text-muted-foreground">{t.time}</span>
								</div>
								<p class="mt-1 truncate text-sm {t.unread ? 'font-semibold' : ''}">{t.subject}</p>
								<p class="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.preview}</p>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</CardContent>
	</Card>

	<Card class="rounded-2xl border-border/50 shadow-sm">
		{#if selected}
			<CardContent class="flex h-full flex-col p-4 sm:p-5">
				<div class="mb-4 flex items-start justify-between gap-2 border-b border-border/50 pb-4">
					<div>
						<h2 class="text-base font-semibold">{selected.subject}</h2>
						<p class="mt-1 text-sm text-muted-foreground">
							{selected.from}
							<span class="mx-1">·</span>
							{selected.role}
						</p>
					</div>
					<div class="flex items-center gap-2">
						{#if selected.unread}
							<Badge class="border-transparent bg-primary/15 text-primary">جدید</Badge>
						{/if}
						<button
							type="button"
							class="rounded-lg p-2 hover:bg-muted {selected.starred ? 'text-amber-500' : 'text-muted-foreground'}"
							aria-label="ستاره"
							onclick={() => onToggleStar(selected.id)}
						>
							<Star class="h-4 w-4 {selected.starred ? 'fill-current' : ''}" />
						</button>
					</div>
				</div>
				<p class="mb-2 text-xs text-muted-foreground">{selected.time}</p>
				<div class="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
					{selected.body}
				</div>
			</CardContent>
		{:else}
			<CardContent class="flex min-h-[280px] items-center justify-center p-6">
				<p class="text-sm text-muted-foreground">یک پیام انتخاب کنید</p>
			</CardContent>
		{/if}
	</Card>
</div>

<Dialog bind:open={composeOpen} class="max-w-lg">
	<div class="pointer-events-auto w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-xl">
		<h2 class="text-lg font-semibold">پیام جدید</h2>
		<p class="mt-1 text-sm text-muted-foreground">ارسال پیام داخلی به همکاران</p>

		<div class="mt-4 space-y-3">
			<div>
				<Label for="msg-to">گیرنده</Label>
				<select
					id="msg-to"
					class="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
					bind:value={compose.recipientId}
				>
					{#each recipients as r (r.id)}
						<option value={r.id}>{r.name} — {r.role}</option>
					{/each}
				</select>
			</div>
			<div>
				<Label for="msg-subject">موضوع</Label>
				<Input id="msg-subject" class="mt-1 h-10 rounded-xl" bind:value={compose.subject} />
			</div>
			<div>
				<Label for="msg-body">متن پیام</Label>
				<textarea
					id="msg-body"
					class="mt-1 min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
					bind:value={compose.body}
				></textarea>
			</div>
		</div>

		<div class="mt-5 flex justify-end gap-2">
			<Button variant="outline" class="rounded-xl" onclick={() => (composeOpen = false)} disabled={sending}>
				انصراف
			</Button>
			<Button class="rounded-xl" onclick={onSendMessage} disabled={sending}>
				{sending ? 'در حال ارسال...' : 'ارسال'}
			</Button>
		</div>
	</div>
</Dialog>
