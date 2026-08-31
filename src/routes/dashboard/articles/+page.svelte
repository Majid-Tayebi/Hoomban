<script lang="ts">
	import { pb } from '$lib/pocketbase';
	import { getUser } from '$lib/auth.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import { Plus, Pencil, Trash2 } from '@lucide/svelte';

	type Art = {
		id: string;
		title: string;
		slug: string;
		excerpt: string;
		content: string;
		is_published: boolean;
		cover?: string;
	};

	let user = $derived(getUser());
	let articles = $state<Art[]>([]);
	let loading = $state(true);
	let showEdit = $state(false);
	let editing = $state<Art | null>(null);
	let coverFile = $state<FileList | null>(null);
	let message = $state('');

	async function load() {
		loading = true;
		try {
			const res = await pb.collection('articles').getList(1, 100, { sort: 'sort_order,-created' });
			articles = res.items.map((a) => ({
				id: a.id,
				title: String(a.title || ''),
				slug: String(a.slug || ''),
				excerpt: String(a.excerpt || ''),
				content: String(a.content || ''),
				is_published: Boolean(a.is_published),
				cover: a.cover ? String(a.cover) : undefined
			}));
		} catch {
			articles = [];
		} finally {
			loading = false;
		}
	}

	function openNew() {
		editing = {
			id: '',
			title: '',
			slug: '',
			excerpt: '',
			content: '',
			is_published: false
		};
		coverFile = null;
		showEdit = true;
		message = '';
	}

	function openEdit(a: Art) {
		editing = { ...a };
		coverFile = null;
		showEdit = true;
		message = '';
	}

	async function save() {
		if (!editing) return;
		if (!editing.title.trim() || !editing.slug.trim()) {
			message = 'عنوان و اسلاگ الزامی است';
			return;
		}
		try {
			const form = new FormData();
			form.append('title', editing.title.trim());
			form.append('slug', editing.slug.trim());
			form.append('excerpt', editing.excerpt);
			form.append('content', editing.content);
			form.append('is_published', editing.is_published ? 'true' : 'false');
			if (user?.id) form.append('author', user.id);
			if (coverFile?.[0]) form.append('cover', coverFile[0]);

			if (editing.id) {
				await pb.collection('articles').update(editing.id, form);
			} else {
				await pb.collection('articles').create(form);
			}
			showEdit = false;
			await load();
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'خطا در ذخیره';
		}
	}

	async function remove(id: string) {
		if (!confirm('حذف مقاله؟')) return;
		try {
			await pb.collection('articles').delete(id);
			await load();
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'حذف فقط برای مدیر مجاز است';
		}
	}

	$effect(() => {
		if (user) load();
	});
</script>

<div class="space-y-4">
	<div class="flex items-start justify-between gap-3">
		<div>
			<h1 class="text-xl font-bold sm:text-2xl">مقالات</h1>
			<p class="mt-1 text-sm text-muted-foreground">CMS — پیش‌نویس و انتشار</p>
		</div>
		<Button class="h-10 rounded-xl" onclick={openNew}>
			<Plus class="ml-1 h-4 w-4" />
			مقاله جدید
		</Button>
	</div>

	{#if loading}
		<p class="py-10 text-center text-sm text-muted-foreground">در حال بارگذاری...</p>
	{:else if articles.length === 0}
		<Card class="rounded-2xl"><CardContent class="py-10 text-center text-sm text-muted-foreground">مقاله‌ای نیست.</CardContent></Card>
	{:else}
		<div class="space-y-2">
			{#each articles as a}
				<Card class="rounded-2xl shadow-sm">
					<CardContent class="flex items-center gap-3 p-4">
						<div class="min-w-0 flex-1">
							<div class="mb-1 flex flex-wrap items-center gap-2">
								<p class="truncate font-semibold">{a.title}</p>
								<Badge variant={a.is_published ? 'default' : 'outline'} class="text-[10px]">
									{a.is_published ? 'منتشر' : 'پیش‌نویس'}
								</Badge>
							</div>
							<p class="truncate text-xs text-muted-foreground">{a.excerpt || a.slug}</p>
						</div>
						<Button variant="outline" size="sm" class="rounded-lg" onclick={() => openEdit(a)}>
							<Pencil class="h-4 w-4" />
						</Button>
						{#if user?.role === 'admin'}
							<Button variant="ghost" size="sm" class="text-destructive" onclick={() => remove(a.id)}>
								<Trash2 class="h-4 w-4" />
							</Button>
						{/if}
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<Dialog open={showEdit}>
	{#if editing}
		<div class="max-h-[80vh] space-y-3 overflow-y-auto">
			<h2 class="text-lg font-bold">{editing.id ? 'ویرایش مقاله' : 'مقاله جدید'}</h2>
			<div class="space-y-1.5">
				<Label>عنوان</Label>
				<Input bind:value={editing.title} />
			</div>
			<div class="space-y-1.5">
				<Label>اسلاگ</Label>
				<Input bind:value={editing.slug} dir="ltr" />
			</div>
			<div class="space-y-1.5">
				<Label>خلاصه</Label>
				<textarea class="min-h-[60px] w-full rounded-xl border px-3 py-2 text-sm" bind:value={editing.excerpt}></textarea>
			</div>
			<div class="space-y-1.5">
				<Label>محتوا</Label>
				<textarea class="min-h-[140px] w-full rounded-xl border px-3 py-2 text-sm" bind:value={editing.content}></textarea>
			</div>
			<div class="space-y-1.5">
				<Label>کاور</Label>
				<input
					type="file"
					accept="image/*"
					class="block w-full text-sm"
					onchange={(e) => {
						coverFile = (e.currentTarget as HTMLInputElement).files;
					}}
				/>
			</div>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={editing.is_published} />
				منتشر شود
			</label>
			{#if message}
				<p class="text-sm text-destructive">{message}</p>
			{/if}
			<div class="flex gap-2">
				<Button variant="outline" class="flex-1 rounded-xl" onclick={() => (showEdit = false)}>انصراف</Button>
				<Button class="flex-1 rounded-xl" onclick={save}>ذخیره</Button>
			</div>
		</div>
	{/if}
</Dialog>
