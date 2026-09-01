<script lang="ts">
	import { getUser } from '$lib/auth.svelte';
	import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
	import { loginRedirectUrl } from '$lib/auth-redirect';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import { FileText, Play } from '@lucide/svelte';

	let { data } = $props();

	let user = $derived(getUser());
	let tests = $derived(data.tests);
	let loadError = $derived(data.loadError);
	let myResults = $state<
		{ id: string; testTitle: string; testSlug: string; created: string; preview: string }[]
	>([]);
	let resultsLoading = $state(true);

	function openTest(slug: string) {
		const target = `/tests/${slug}`;
		if (!user?.id || user.id === 'demo-user') {
			goto(loginRedirectUrl(target));
			return;
		}
		goto(target);
	}

	function viewResult(resultId: string) {
		const target = `/tests/result/${resultId}`;
		if (!user) {
			goto(loginRedirectUrl(target));
			return;
		}
		goto(target);
	}

	function getCategoryLabel(category: string) {
		const labels: Record<string, string> = {
			personality: 'شخصیتی',
			depression: 'افسردگی',
			marriage: 'ازدواج',
			kids: 'کودکان'
		};
		return labels[category] || category;
	}

	function resultForSlug(slug: string) {
		return myResults.find((r) => r.testSlug === slug);
	}

	function formatDate(iso: string) {
		try {
			return new Intl.DateTimeFormat('fa-IR', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(new Date(iso));
		} catch {
			return iso;
		}
	}

	async function loadMyResults() {
		if (!user?.id || user.id === 'demo-user') {
			myResults = [];
			resultsLoading = false;
			return;
		}
		resultsLoading = true;
		try {
			const res = await pb.collection('psych_results').getList(1, 50, {
				filter: `user = "${user.id}"`,
				sort: '-id',
				expand: 'test',
				...PB_NO_AUTO_CANCEL
			});
			myResults = res.items.map((item) => {
				const test = item.expand?.test as { title?: string; slug?: string } | undefined;
				const preview = String(item.interpretation_text || '')
					.split('\n')
					.find((line) => line.trim())?.slice(0, 120);
				return {
					id: item.id,
					testTitle: String(test?.title || 'تست'),
					testSlug: String(test?.slug || ''),
					created: String(item.created || ''),
					preview: preview || 'مشاهده پاسخنامه و تفسیر کامل'
				};
			});
		} catch {
			myResults = [];
		} finally {
			resultsLoading = false;
		}
	}

	$effect(() => {
		if (user?.id) void loadMyResults();
	});
</script>

<div class="space-y-4 sm:space-y-6">
	<div>
		<h1 class="text-xl font-bold sm:text-2xl">تست‌های روانشناسی</h1>
		<p class="mt-1 text-sm text-muted-foreground">انتخاب و انجام تست‌های استاندارد</p>
	</div>

	{#if !resultsLoading && myResults.length > 0}
		<Card class="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
			<CardHeader class="px-4 pt-4 sm:px-6">
				<CardTitle class="text-base">نتایج و تفسیر آزمون‌های شما</CardTitle>
				<CardDescription class="text-xs sm:text-sm">
					نیازی به تکرار آزمون نیست — روی «مشاهده تفسیر» بزنید
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-2 px-4 pb-4 sm:px-6">
				{#each myResults as row (row.id)}
					<div
						class="flex flex-col gap-2 rounded-xl border border-border/70 bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="min-w-0">
							<p class="text-sm font-semibold">{row.testTitle}</p>
							<p class="mt-0.5 text-xs text-muted-foreground">{formatDate(row.created)}</p>
							<p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.preview}</p>
						</div>
						<Button class="h-10 shrink-0 rounded-xl" onclick={() => viewResult(row.id)}>
							<FileText class="ms-1 h-4 w-4" />
							مشاهده تفسیر و پاسخنامه
						</Button>
					</div>
				{/each}
			</CardContent>
		</Card>
	{/if}

	{#if loadError}
		<Card class="rounded-2xl border-destructive/30 shadow-sm">
			<CardContent class="space-y-3 py-8 text-center">
				<p class="text-sm text-destructive">بارگذاری تست‌ها ناموفق بود.</p>
				<p class="text-xs text-muted-foreground">{loadError}</p>
			</CardContent>
		</Card>
	{:else if tests.length === 0}
		<Card class="rounded-2xl shadow-sm">
			<CardContent class="py-10 text-center">
				<p class="text-sm text-muted-foreground">هنوز تستی موجود نیست.</p>
			</CardContent>
		</Card>
	{:else}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each tests as test (test.id)}
				{@const prior = resultForSlug(test.slug)}
				<Card class="flex flex-col rounded-2xl shadow-sm">
					<CardHeader class="px-4 pt-4 sm:px-6">
						<div class="mb-2 flex flex-wrap items-center gap-2">
							<Badge variant="secondary" class="text-[10px]">{getCategoryLabel(test.category)}</Badge>
							{#if test.test_type === 'neo_240'}
								<Badge class="text-[10px]">۲۴۰ سوال</Badge>
							{/if}
							{#if prior}
								<Badge variant="outline" class="text-[10px]">انجام‌شده</Badge>
							{/if}
						</div>
						<CardTitle class="text-base leading-snug">{test.title}</CardTitle>
						<CardDescription class="line-clamp-2 text-xs sm:text-sm">
							{test.description || 'بدون توضیحات'}
						</CardDescription>
					</CardHeader>
					<CardContent class="mt-auto space-y-2 px-4 pb-4 sm:px-6">
						{#if prior}
							<Button class="h-11 w-full rounded-xl" onclick={() => viewResult(prior.id)}>
								<FileText class="ms-1 h-4 w-4" />
								مشاهده تفسیر و پاسخنامه
							</Button>
							<Button variant="outline" class="h-10 w-full rounded-xl" onclick={() => openTest(test.slug)}>
								<Play class="ms-1 h-4 w-4" />
								شروع مجدد
							</Button>
						{:else}
							<Button class="h-11 w-full rounded-xl" onclick={() => openTest(test.slug)}>
								{user ? 'شروع آزمون' : 'ورود و شروع آزمون'}
							</Button>
						{/if}
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
