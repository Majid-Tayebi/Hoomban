<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { globalSearch } from '$lib/search.svelte';
	import { runGlobalSearch } from '$lib/search/services/global-search';
	import Input from '$lib/components/ui/input.svelte';
	import { Search, X, LoaderCircle } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	const hasQuery = $derived(globalSearch.query.trim().length >= 2);
	const showResults = $derived(
		globalSearch.open && (hasQuery || globalSearch.loading || globalSearch.results.length > 0)
	);

	$effect(() => {
		const q = globalSearch.query;
		const user = getUser();
		if (!globalSearch.open || !user) return;

		clearTimeout(debounceTimer);
		if (q.trim().length < 2) {
			globalSearch.setResults([]);
			globalSearch.setLoading(false);
			return;
		}

		globalSearch.setLoading(true);
		debounceTimer = setTimeout(async () => {
			try {
				const results = await runGlobalSearch(q, user.role, user.id);
				if (globalSearch.query === q) {
					globalSearch.setResults(results);
				}
			} finally {
				if (globalSearch.query === q) {
					globalSearch.setLoading(false);
				}
			}
		}, 280);

		return () => clearTimeout(debounceTimer);
	});

	function navigate(href: string) {
		globalSearch.close();
		goto(href);
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			globalSearch.close();
		}
	}
</script>

{#if globalSearch.open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
		onclick={handleBackdropClick}
		aria-hidden="true"
	></div>

	<div class="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-5 sm:pt-4">
		<div class="pointer-events-auto w-full max-w-xl">
			<div
				class="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl ring-1 ring-black/5 dark:ring-white/10"
			>
				<div class="flex items-center gap-2 border-b border-border/40 px-3 py-2 sm:px-4">
					<Search class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					<div class="min-w-0 flex-1">
						<Input
							type="search"
							bind:value={globalSearch.query}
							placeholder="جستجو در پنل..."
							variant="ghost"
							size="lg"
							autofocus
							clearable
							onClear={() => globalSearch.clear()}
							class="h-10 rounded-xl border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
						/>
					</div>
					<button
						type="button"
						class="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
						aria-label="بستن جستجو"
						onclick={() => globalSearch.close()}
					>
						<X class="size-4" />
					</button>
				</div>

				{#if showResults}
					<div class="max-h-[min(60vh,420px)] overflow-y-auto p-1.5">
						{#if globalSearch.loading}
							<div class="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
								<LoaderCircle class="size-4 animate-spin" />
								<span>در حال جستجو...</span>
							</div>
						{:else if !globalSearch.results.length}
							<p class="py-8 text-center text-sm text-muted-foreground">نتیجه‌ای یافت نشد.</p>
						{:else}
							<ul class="space-y-0.5">
								{#each globalSearch.results as item (item.id)}
									<li>
										<button
											type="button"
											class={cn(
												'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-right transition-colors duration-200 hover:bg-muted/80'
											)}
											onclick={() => navigate(item.href)}
										>
											<span
												class="mt-0.5 shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
											>
												{item.category}
											</span>
											<span class="min-w-0 flex-1">
												<span class="block truncate text-sm font-medium">{item.title}</span>
												{#if item.subtitle}
													<span class="mt-0.5 block truncate text-xs text-muted-foreground">
														{item.subtitle}
													</span>
												{/if}
											</span>
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{:else if globalSearch.query.trim().length > 0 && globalSearch.query.trim().length < 2}
					<p class="px-4 py-3 text-xs text-muted-foreground">حداقل ۲ حرف وارد کنید.</p>
				{:else}
					<p class="px-4 py-3 text-xs text-muted-foreground">
						مراجع، متخصص، نوبت و صفحات — بر اساس سطح دسترسی شما
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
