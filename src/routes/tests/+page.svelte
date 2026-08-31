<script lang="ts">
	import { pb } from '$lib/pocketbase';
	import { getUser } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Badge from '$lib/components/ui/badge.svelte';

	let user = $derived(getUser());
	let tests = $state<{ id: string; title: string; description?: string; category: string; slug: string }[]>([]);
	let isLoading = $state(true);

	async function loadTests() {
		try {
			const result = await pb.collection('psych_tests').getList(1, 50, {
				filter: 'is_active = true',
				sort: '-created'
			});
			tests = result.items.map((item) => ({
				id: item.id,
				title: String(item.title ?? ''),
				description: item.description ? String(item.description) : undefined,
				category: String(item.category ?? ''),
				slug: String(item.slug ?? '')
			}));
		} catch {
			tests = [];
		} finally {
			isLoading = false;
		}
	}

	function startTest(slug: string) {
		if (!user) {
			goto('/auth');
			return;
		}
		goto(`/tests/${slug}`);
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

	$effect(() => {
		loadTests();
	});
</script>

<div class="space-y-4 sm:space-y-6">
	<div>
		<h1 class="text-xl font-bold sm:text-2xl">تست‌های روانشناسی</h1>
		<p class="mt-1 text-sm text-muted-foreground">انتخاب و انجام تست‌های استاندارد</p>
	</div>

	{#if isLoading}
		<p class="py-12 text-center text-sm text-muted-foreground">در حال بارگذاری...</p>
	{:else if tests.length === 0}
		<Card class="rounded-2xl shadow-sm">
			<CardContent class="py-10 text-center">
				<p class="text-sm text-muted-foreground">هنوز تستی موجود نیست.</p>
			</CardContent>
		</Card>
	{:else}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each tests as test}
				<Card class="flex flex-col rounded-2xl shadow-sm">
					<CardHeader class="px-4 pt-4 sm:px-6">
						<div class="mb-2">
							<Badge variant="secondary" class="text-[10px]">{getCategoryLabel(test.category)}</Badge>
						</div>
						<CardTitle class="text-base leading-snug">{test.title}</CardTitle>
						<CardDescription class="line-clamp-2 text-xs sm:text-sm">
							{test.description || 'بدون توضیحات'}
						</CardDescription>
					</CardHeader>
					<CardContent class="mt-auto px-4 pb-4 sm:px-6">
						<Button class="h-11 w-full rounded-xl" onclick={() => startTest(test.slug)}>
							شروع تست
						</Button>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
