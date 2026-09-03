<script lang="ts">
	import { getUser } from '$lib/auth.svelte';
	import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
	import { goto } from '$app/navigation';
	import { canEditPsychTests, canViewPsychTestsDashboard } from '$lib/rbac';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Select from '$lib/components/ui/select.svelte';
	import { PSYCH_TEST_CATEGORIES, psychCategoryLabel } from '$lib/psych/categories';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import { Plus, Trash2 } from '@lucide/svelte';

	let user = $derived(getUser());
	const canView = $derived(canViewPsychTestsDashboard(user?.role));
	const canEdit = $derived(canEditPsychTests(user?.role));
	let tests = $state<
		{ id: string; title: string; slug: string; description?: string; category: string; is_active: boolean }[]
	>([]);
	let isLoading = $state(true);
	let showCreate = $state(false);
	let error = $state('');

	let newTest = $state({
		title: '',
		slug: '',
		description: '',
		category: 'personality',
		is_active: true
	});

	async function loadTests() {
		isLoading = true;
		try {
			const result = await pb.collection('psych_tests').getList(1, 50, {
				sort: '-id',
				...PB_NO_AUTO_CANCEL
			});
			tests = result.items.map((item) => ({
				id: item.id,
				title: String(item.title ?? ''),
				slug: String(item.slug ?? ''),
				description: item.description ? String(item.description) : undefined,
				category: String(item.category ?? ''),
				is_active: Boolean(item.is_active)
			}));
		} catch (err: unknown) {
			const e = err as { message?: string };
			error = e.message || 'خطا در بارگذاری تست‌ها';
			tests = [];
		} finally {
			isLoading = false;
		}
	}

	async function createTest() {
		error = '';
		if (!newTest.title.trim() || !newTest.slug.trim()) {
			error = 'عنوان و اسلاگ الزامی است';
			return;
		}
		try {
			const created = await pb.collection('psych_tests').create({
				title: newTest.title.trim(),
				slug: newTest.slug.trim(),
				description: newTest.description.trim(),
				category: newTest.category,
				is_active: newTest.is_active
			});
			showCreate = false;
			newTest = { title: '', slug: '', description: '', category: 'personality', is_active: true };
			await goto(`/dashboard/tests/${created.id}`);
		} catch (err: unknown) {
			const e = err as { message?: string };
			error = e.message || 'خطا در ساخت تست';
		}
	}

	async function deleteTest(id: string) {
		if (!confirm('حذف این تست؟')) return;
		try {
			await pb.collection('psych_tests').delete(id);
			await loadTests();
		} catch (err: unknown) {
			const e = err as { message?: string };
			alert(e.message || 'حذف ناموفق');
		}
	}

	function categoryLabel(c: string) {
		return psychCategoryLabel(c);
	}

	$effect(() => {
		if (user && !canView) goto('/dashboard');
	});

	$effect(() => {
		if (user && canView) loadTests();
	});
</script>

<div class="space-y-4">
	<div class="flex items-start justify-between gap-3">
		<div>
			<h1 class="text-xl font-bold sm:text-2xl">مدیریت تست‌ها</h1>
			<p class="mt-1 text-sm text-muted-foreground">ساخت و مدیریت تست‌های روانشناسی</p>
		</div>
		<Button class="h-10 shrink-0 rounded-xl" onclick={() => (showCreate = true)} disabled={!canEdit}>
			<Plus class="ms-1 h-4 w-4" />
			تست جدید
		</Button>
	</div>

	{#if !canEdit}
		<p class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
			برای ویرایش سوالات و تنظیمات نمره‌دهی با حساب <strong>نویسنده</strong> وارد شوید.
		</p>
	{/if}

	{#if isLoading}
		<p class="py-10 text-center text-sm text-muted-foreground">در حال بارگذاری...</p>
	{:else if error}
		<p class="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
	{:else if tests.length === 0}
		<Card class="rounded-2xl shadow-sm">
			<CardContent class="py-10 text-center text-sm text-muted-foreground">تستی ثبت نشده است.</CardContent>
		</Card>
	{:else}
		<div class="space-y-2.5">
			{#each tests as test}
				<Card class="rounded-2xl shadow-sm">
					<CardContent class="flex items-center gap-3 p-4">
						<div class="min-w-0 flex-1">
							<div class="mb-1 flex flex-wrap items-center gap-2">
								<p class="truncate text-sm font-semibold">{test.title}</p>
								<Badge variant={test.is_active ? 'default' : 'outline'} class="text-[10px]">
									{test.is_active ? 'فعال' : 'غیرفعال'}
								</Badge>
								<Badge variant="secondary" class="text-[10px]">{categoryLabel(test.category)}</Badge>
							</div>
							<p class="truncate text-xs text-muted-foreground" dir="ltr">{test.slug}</p>
						</div>
						<div class="flex shrink-0 gap-1">
							<Button
								variant="outline"
								size="sm"
								class="rounded-lg"
								onclick={() => goto(`/dashboard/tests/${test.id}`)}
							>
								ویرایشگر
							</Button>
							<Button variant="outline" size="sm" class="rounded-lg" onclick={() => goto(`/tests/${test.slug}`)}>
								مشاهده
							</Button>
							{#if canEdit}
								<Button variant="ghost" size="sm" class="rounded-lg text-destructive" onclick={() => deleteTest(test.id)}>
									<Trash2 class="h-4 w-4" />
								</Button>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<Dialog open={showCreate}>
	<div class="space-y-4">
		<div>
			<h2 class="text-base font-semibold">تست جدید</h2>
			<p class="text-xs text-muted-foreground">اطلاعات پایه تست را وارد کنید</p>
		</div>
		<div class="space-y-3">
			<div class="space-y-1.5">
				<Label for="t-title">عنوان</Label>
				<Input id="t-title" bind:value={newTest.title} />
			</div>
			<div class="space-y-1.5">
				<Label for="t-slug">اسلاگ (لاتین)</Label>
				<Input id="t-slug" bind:value={newTest.slug} dir="ltr" class="text-left" placeholder="mood-sample" />
			</div>
			<div class="space-y-1.5">
				<Label for="t-desc">توضیح</Label>
				<Input id="t-desc" bind:value={newTest.description} />
			</div>
			<div class="space-y-1.5">
				<Label for="t-cat">دسته</Label>
				<Select id="t-cat" bind:value={newTest.category} class="h-11 rounded-xl">
					{#each PSYCH_TEST_CATEGORIES as cat (cat.value)}
						<option value={cat.value}>{cat.label}</option>
					{/each}
				</Select>
			</div>
			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
		</div>
		<div class="grid grid-cols-2 gap-2">
			<Button variant="outline" class="h-11 rounded-xl" onclick={() => (showCreate = false)}>انصراف</Button>
			<Button class="h-11 rounded-xl" onclick={createTest}>ایجاد</Button>
		</div>
	</div>
</Dialog>
