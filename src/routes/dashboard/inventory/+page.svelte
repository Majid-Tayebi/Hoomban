<script lang="ts">
	import { getUser, isAuthHydrated } from '$lib/auth.svelte';
	import {
		buildInventoryStats,
		filterInventory,
		loadInventoryItems,
		createInventoryItem
	} from '$lib/inventory';
	import type { InventoryItem } from '$lib/inventory/types';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import { Package, Search, AlertTriangle, Plus } from '@lucide/svelte';

	let query = $state('');
	let status = $state('all');
	let items = $state<InventoryItem[]>([]);
	let loading = $state(true);
	let toast = $state('');
	let addOpen = $state(false);
	let saving = $state(false);

	let form = $state({
		name: '',
		sku: '',
		category: 'مصرفی',
		quantity: 0,
		unit: 'عدد',
		minStock: 0,
		location: ''
	});

	const user = $derived(getUser());
	const hydrated = $derived(isAuthHydrated());
	const stats = $derived(buildInventoryStats(items));
	const filtered = $derived(filterInventory(items, query, status));

	const statusLabel: Record<string, string> = {
		in_stock: 'موجود',
		low: 'کم',
		out: 'ناموجود'
	};

	const statusClass: Record<string, string> = {
		in_stock: 'bg-primary/15 text-primary border-transparent',
		low: 'bg-amber-100 text-amber-800 border-transparent dark:bg-amber-900/30 dark:text-amber-300',
		out: 'bg-destructive/15 text-destructive border-transparent'
	};

	$effect(() => {
		if (!hydrated || !user?.id) return;
		loading = true;
		void loadInventoryItems(user)
			.then((rows) => {
				items = rows;
			})
			.finally(() => {
				loading = false;
			});
	});

	function showToast(msg: string) {
		toast = msg;
		setTimeout(() => (toast = ''), 3000);
	}

	async function onSaveItem() {
		if (!form.name.trim() || !form.sku.trim()) {
			showToast('نام و کد SKU الزامی است');
			return;
		}
		saving = true;
		try {
			const created = await createInventoryItem({
				name: form.name.trim(),
				sku: form.sku.trim(),
				category: form.category.trim(),
				quantity: Number(form.quantity) || 0,
				unit: form.unit.trim(),
				minStock: Number(form.minStock) || 0,
				location: form.location.trim()
			});
			items = [created, ...items];
			addOpen = false;
			form = {
				name: '',
				sku: '',
				category: 'مصرفی',
				quantity: 0,
				unit: 'عدد',
				minStock: 0,
				location: ''
			};
			showToast('قلم جدید ثبت شد');
		} catch (err: unknown) {
			showToast(err instanceof Error ? err.message : 'ثبت ناموفق بود');
		} finally {
			saving = false;
		}
	}
</script>

<header class="mb-5 flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="text-xl font-bold tracking-tight sm:text-2xl">موجودی</h1>
		<p class="mt-1 text-sm text-muted-foreground">تجهیزات و اقلام مصرفی کلینیک</p>
	</div>
	<Button class="h-10 rounded-xl" onclick={() => (addOpen = true)}>
		<Plus class="ml-1.5 h-4 w-4" />
		قلم جدید
	</Button>
</header>

{#if toast}
	<p class="mb-4 rounded-xl bg-accent/70 px-3 py-2 text-sm">{toast}</p>
{/if}

<section class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
	{#each stats as s (s.id)}
		<Card class="rounded-2xl border-border/50 shadow-sm">
			<CardContent class="p-4">
				<p class="text-xs text-muted-foreground">{s.label}</p>
				<p class="mt-1 text-2xl font-bold tabular-nums">{s.value.toLocaleString('fa-IR')}</p>
				<p class="mt-1 text-[11px] text-muted-foreground">{s.subtext}</p>
			</CardContent>
		</Card>
	{/each}
</section>

<Card class="mb-4 rounded-2xl border-border/50 shadow-sm">
	<CardContent class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
		<div class="relative min-w-0 flex-1">
			<Search class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input class="h-11 rounded-xl pr-10" placeholder="جستجوی نام، کد یا دسته..." bind:value={query} />
		</div>
		<div class="flex flex-wrap gap-2">
			{#each [
				{ id: 'all', label: 'همه' },
				{ id: 'in_stock', label: 'موجود' },
				{ id: 'low', label: 'کم' },
				{ id: 'out', label: 'ناموجود' }
			] as opt}
				<button
					type="button"
					class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors
						{status === opt.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}"
					onclick={() => (status = opt.id)}
				>
					{opt.label}
				</button>
			{/each}
		</div>
	</CardContent>
</Card>

{#if filtered.some((i) => i.status !== 'in_stock')}
	<div class="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
		<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
		<span>برخی اقلام کم‌موجود یا ناموجود هستند؛ سفارش‌گذاری را بررسی کنید.</span>
	</div>
{/if}

{#if loading}
	<p class="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">در حال بارگذاری...</p>
{:else if filtered.length === 0}
	<p class="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">موردی یافت نشد.</p>
{:else}
	<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
		{#each filtered as item (item.id)}
			<Card class="rounded-2xl border-border/50 shadow-sm transition-shadow hover:shadow-md">
				<CardHeader class="space-y-0 px-4 pb-2 pt-4">
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-center gap-2">
							<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<Package class="h-4 w-4" />
							</div>
							<div>
								<CardTitle class="text-sm font-semibold">{item.name}</CardTitle>
								<CardDescription class="text-[11px]" dir="ltr">{item.sku}</CardDescription>
							</div>
						</div>
						<Badge class={statusClass[item.status]}>{statusLabel[item.status]}</Badge>
					</div>
				</CardHeader>
				<CardContent class="space-y-2 px-4 pb-4 text-xs text-muted-foreground">
					<p>
						<span class="font-medium text-foreground">{item.quantity.toLocaleString('fa-IR')}</span>
						{item.unit}
						<span class="mx-1">·</span>
						حداقل {item.minStock.toLocaleString('fa-IR')}
					</p>
					<p>{item.category} — {item.location}</p>
					<p>آخرین به‌روزرسانی: {item.updatedAt}</p>
				</CardContent>
			</Card>
		{/each}
	</div>
{/if}

<Dialog bind:open={addOpen} class="max-w-lg">
	<div class="pointer-events-auto w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-xl">
		<h2 class="text-lg font-semibold">ثبت قلم جدید</h2>
		<p class="mt-1 text-sm text-muted-foreground">اطلاعات کالا را وارد کنید</p>

		<div class="mt-4 space-y-3">
			<div>
				<Label for="inv-name">نام</Label>
				<Input id="inv-name" class="mt-1 h-10 rounded-xl" bind:value={form.name} />
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<Label for="inv-sku">کد SKU</Label>
					<Input id="inv-sku" class="mt-1 h-10 rounded-xl" dir="ltr" bind:value={form.sku} />
				</div>
				<div>
					<Label for="inv-category">دسته</Label>
					<Input id="inv-category" class="mt-1 h-10 rounded-xl" bind:value={form.category} />
				</div>
			</div>
			<div class="grid grid-cols-3 gap-3">
				<div>
					<Label for="inv-qty">موجودی</Label>
					<Input id="inv-qty" type="number" class="mt-1 h-10 rounded-xl" bind:value={form.quantity} />
				</div>
				<div>
					<Label for="inv-min">حداقل</Label>
					<Input id="inv-min" type="number" class="mt-1 h-10 rounded-xl" bind:value={form.minStock} />
				</div>
				<div>
					<Label for="inv-unit">واحد</Label>
					<Input id="inv-unit" class="mt-1 h-10 rounded-xl" bind:value={form.unit} />
				</div>
			</div>
			<div>
				<Label for="inv-loc">محل نگهداری</Label>
				<Input id="inv-loc" class="mt-1 h-10 rounded-xl" bind:value={form.location} />
			</div>
		</div>

		<div class="mt-5 flex justify-end gap-2">
			<Button variant="outline" class="rounded-xl" onclick={() => (addOpen = false)} disabled={saving}>
				انصراف
			</Button>
			<Button class="rounded-xl" onclick={onSaveItem} disabled={saving}>
				{saving ? 'در حال ذخیره...' : 'ذخیره'}
			</Button>
		</div>
	</div>
</Dialog>
