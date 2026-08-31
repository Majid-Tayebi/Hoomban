<script lang="ts">
	import { pb } from '$lib/pocketbase';
	import { getUser } from '$lib/auth.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import MoneyInput from '$lib/components/ui/money-input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import { Plus, Pencil, Trash2, Tag } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import { formatAmount } from '$lib/money';

	type Svc = {
		id: string;
		title: string;
		slug: string;
		description: string;
		category: string;
		price: number;
		is_active: boolean;
	};

	let user = $derived(getUser());
	let services = $state<Svc[]>([]);
	let loading = $state(true);
	let showEdit = $state(false);
	let editing = $state<Svc | null>(null);
	let message = $state('');

	async function load() {
		loading = true;
		try {
			const res = await pb.collection('services').getList(1, 100, { sort: 'sort_order' });
			services = res.items.map((s) => ({
				id: s.id,
				title: String(s.title || ''),
				slug: String(s.slug || ''),
				description: String(s.description || ''),
				category: String(s.category || ''),
				price: Number(s.price || 0),
				is_active: Boolean(s.is_active !== false)
			}));
		} catch {
			services = [];
		} finally {
			loading = false;
		}
	}

	function openNew() {
		editing = {
			id: '',
			title: '',
			slug: '',
			description: '',
			category: '',
			price: 0,
			is_active: true
		};
		showEdit = true;
		message = '';
	}

	function openEdit(s: Svc) {
		editing = { ...s };
		showEdit = true;
		message = '';
	}

	async function save() {
		if (!editing?.title.trim() || !editing.slug.trim()) {
			message = 'عنوان و اسلاگ الزامی است';
			return;
		}
		try {
			const payload = {
				title: editing.title.trim(),
				slug: editing.slug.trim(),
				description: editing.description,
				category: editing.category,
				price: Number(editing.price),
				is_active: editing.is_active
			};
			if (editing.id) await pb.collection('services').update(editing.id, payload);
			else await pb.collection('services').create(payload);
			showEdit = false;
			await load();
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'خطا';
		}
	}

	async function remove(id: string) {
		if (!confirm('حذف خدمت؟')) return;
		try {
			await pb.collection('services').delete(id);
			await load();
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'حذف فقط برای مدیر';
		}
	}

	$effect(() => {
		if (user) load();
	});
</script>

<div class="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
	<div class="flex items-center justify-end border-b border-border/60 px-4 py-3 sm:px-5">
		<Button class="h-9 rounded-xl px-3 text-sm" onclick={openNew}>
			<Plus class="h-4 w-4" />
			خدمت جدید
		</Button>
	</div>

	<div class="p-4 sm:p-5">
		{#if loading}
			<p class="py-16 text-center text-sm text-muted-foreground">در حال بارگذاری…</p>
		{:else if services.length === 0}
			<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-16 text-center">
				<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
					<Tag class="h-5 w-5 text-muted-foreground" />
				</div>
				<p class="text-sm font-medium text-foreground">هنوز خدمتی ثبت نشده</p>
				<p class="mt-1 text-xs text-muted-foreground">اولین خدمت کلینیک را اضافه کنید.</p>
				<Button class="mt-4 h-9 rounded-xl px-4 text-sm" onclick={openNew}>
					<Plus class="h-4 w-4" />
					خدمت جدید
				</Button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
				{#each services as s (s.id)}
					<article
						class={cn(
							'group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background transition-all duration-200 hover:border-border hover:shadow-md',
							!s.is_active && 'opacity-75'
						)}
					>
						<div class="flex items-start justify-between gap-3 p-4 pb-3">
							<div class="min-w-0 flex-1">
								{#if s.category}
									<span
										class="mb-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary"
									>
										<Tag class="h-3 w-3" />
										{s.category}
									</span>
								{/if}
								<h3 class="text-base font-semibold leading-snug tracking-tight">{s.title}</h3>
								<p class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
									{s.description || 'بدون توضیح'}
								</p>
							</div>

							<button
								type="button"
								class="flex shrink-0 flex-col items-center gap-1 rounded-xl p-1.5 transition-colors duration-200 hover:bg-muted"
								aria-label="ویرایش {s.title}"
								onclick={() => openEdit(s)}
							>
								<Pencil class="h-3.5 w-3.5 text-muted-foreground transition-colors duration-200 group-hover:text-foreground" />
								<Badge
									variant={s.is_active ? 'default' : 'outline'}
									class="px-2 py-0 text-[10px] font-medium"
								>
									{s.is_active ? 'فعال' : 'غیرفعال'}
								</Badge>
							</button>
						</div>

						<div class="mt-auto flex items-center justify-between gap-2 border-t border-border/50 px-4 py-3">
							<p class="text-lg font-bold tabular-nums text-primary">
								{formatAmount(s.price)}
								<span class="mr-1 text-xs font-normal text-muted-foreground">تومان</span>
							</p>

							{#if user?.role === 'admin'}
								<button
									type="button"
									class="rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
									aria-label="حذف {s.title}"
									onclick={() => remove(s.id)}
								>
									<Trash2 class="h-4 w-4" />
								</button>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</div>

<Dialog bind:open={showEdit} class="max-w-md">
	{#if editing}
		<div class="space-y-4">
			<div>
				<h2 class="text-lg font-semibold tracking-tight">
					{editing.id ? 'ویرایش خدمت' : 'خدمت جدید'}
				</h2>
				<p class="mt-1 text-xs text-muted-foreground">اطلاعات خدمت و تعرفه را وارد کنید.</p>
			</div>

			<div class="space-y-3">
				<div class="space-y-1.5">
					<Label for="svc-title">عنوان</Label>
					<Input id="svc-title" class="rounded-xl" bind:value={editing.title} />
				</div>
				<div class="space-y-1.5">
					<Label for="svc-slug">اسلاگ</Label>
					<Input id="svc-slug" class="rounded-xl" bind:value={editing.slug} dir="ltr" />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1.5">
						<Label for="svc-category">دسته</Label>
						<Input id="svc-category" class="rounded-xl" bind:value={editing.category} />
					</div>
					<div class="space-y-1.5">
						<Label for="svc-price">قیمت (تومان)</Label>
						<MoneyInput id="svc-price" class="rounded-xl" bind:value={editing.price} />
					</div>
				</div>
				<div class="space-y-1.5">
					<Label for="svc-desc">توضیح</Label>
					<textarea
						id="svc-desc"
						class="min-h-[88px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						bind:value={editing.description}
					></textarea>
				</div>
				<label class="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm">
					<input type="checkbox" bind:checked={editing.is_active} class="rounded" />
					فعال
				</label>
			</div>

			{#if message}
				<p class="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
			{/if}

			<div class="flex gap-2 pt-1">
				<Button variant="outline" class="flex-1 rounded-xl" onclick={() => (showEdit = false)}>
					انصراف
				</Button>
				<Button class="flex-1 rounded-xl" onclick={save}>ذخیره</Button>
			</div>
		</div>
	{/if}
</Dialog>
