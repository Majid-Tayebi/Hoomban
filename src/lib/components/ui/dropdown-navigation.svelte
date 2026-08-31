<script lang="ts">
	let {
		navItems = []
	}: {
		navItems: {
			id: number;
			label: string;
			subMenus?: {
				title: string;
				items: {
					label: string;
					description: string;
					icon: string;
				}[];
			}[];
			link?: string;
		}[];
	} = $props();

	let openMenu = $state<string | null>(null);
	let isHover = $state<number | null>(null);

	function handleHover(menuLabel: string | null) {
		openMenu = menuLabel;
	}

	function handleMouseEnter(navId: number) {
		isHover = navId;
	}

	function handleMouseLeave() {
		isHover = null;
	}

	function handleClick(navItem: any) {
		if (navItem.link) {
			window.location.href = navItem.link;
		} else if (navItem.subMenus) {
			openMenu = openMenu === navItem.label ? null : navItem.label;
		}
	}
</script>

<nav class="relative">
	<ul class="relative flex items-center justify-center space-x-4">
		{#each navItems as navItem}
			<li
				class="relative"
				onmouseenter={() => handleHover(navItem.label)}
				onmouseleave={() => handleHover(null)}
			>
				<button
					class="text-sm py-1.5 px-4 flex cursor-pointer group transition-colors duration-300 items-center justify-center gap-1 text-muted-foreground hover:text-foreground relative"
					onmouseenter={() => handleMouseEnter(navItem.id)}
					onmouseleave={handleMouseLeave}
					onclick={() => handleClick(navItem)}
				>
					<span>{navItem.label}</span>
					{#if navItem.subMenus}
						<span class="h-4 w-4 group-hover:rotate-180 duration-300 transition-transform {openMenu === navItem.label ? 'rotate-180' : ''}">
							▼
						</span>
					{/if}
					{#if isHover === navItem.id || openMenu === navItem.label}
						<div class="absolute inset-0 size-full bg-primary/10 rounded-full" />
					{/if}
				</button>
			</li>
		{/each}
	</ul>
</nav>