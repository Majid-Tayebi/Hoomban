<script lang="ts" module>
	import type { Component } from 'svelte';

	/** Leaf link shown under a group label (MenuSub style). */
	export type AppNavLeaf = {
		title: string;
		href: string;
		icon?: Component;
	};

	export type AppNavGroup = {
		label: string;
		items: AppNavLeaf[];
	};
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { HOOMBAN_BRAND_NAME, HOOMBAN_LOGO_SRC } from '$lib/brand/logo';
	import { cn } from '$lib/utils';

	let {
		groups,
		onNavigate
	}: {
		groups: AppNavGroup[];
		onNavigate?: () => void;
	} = $props();

	const pathname = $derived($page.url.pathname);

	function isActive(href: string) {
		if (href === '/dashboard') return pathname === '/dashboard';
		return pathname === href || pathname.startsWith(href + '/');
	}

	function go(href: string) {
		onNavigate?.();
		goto(href);
	}
</script>

<div class="flex h-full flex-col bg-sidebar text-sidebar-foreground">
	<div class="flex items-center gap-2 border-b border-sidebar-border px-3 py-3">
		<a
			href="/dashboard"
			class="flex items-center gap-2 rounded-md px-1 py-1 transition-colors duration-200 hover:bg-sidebar-accent print:hidden"
			onclick={(e) => {
				e.preventDefault();
				go('/dashboard');
			}}
		>
			<img
				src={HOOMBAN_LOGO_SRC}
				alt=""
				class="h-8 w-8 shrink-0 object-contain"
				width="64"
				height="64"
			/>
			<span class="text-sm font-semibold">{HOOMBAN_BRAND_NAME}</span>
		</a>
	</div>

	<nav class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3" aria-label="منوی اصلی">
		{#each groups as group (group.label)}
			<div class="flex flex-col gap-1">
				<p class="px-2 text-sm font-medium text-sidebar-foreground">
					{group.label}
				</p>
				<ul
					class="mx-2 flex min-w-0 flex-col gap-0.5 border-s border-sidebar-border px-2.5"
				>
					{#each group.items as item (item.href)}
						<li>
							<a
								href={item.href}
								class={cn(
									'flex h-8 items-center rounded-md px-2 text-sm text-sidebar-foreground/80 outline-none transition-colors duration-200',
									'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
									'focus-visible:ring-2 focus-visible:ring-sidebar-ring',
									isActive(item.href) &&
										'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
								)}
								onclick={(e) => {
									e.preventDefault();
									go(item.href);
								}}
							>
								<span class="truncate">{item.title}</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</nav>
</div>
