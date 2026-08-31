<script lang="ts">
	import { getTheme, setTheme, isThemeHydrated } from '$lib/theme.svelte';
	import { cn } from '$lib/utils';
	import { Moon, Sun } from '@lucide/svelte';

	let { class: className = '' }: { class?: string } = $props();

	let current = $derived(getTheme());
	let ready = $derived(isThemeHydrated());
	let isDark = $derived(current === 'dark');

	function toggleTheme() {
		setTheme(isDark ? 'light' : 'dark');
	}
</script>

<button
	type="button"
	class={cn(
		'inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/70',
		!ready && 'opacity-60',
		className
	)}
	aria-label={isDark ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
	title={isDark ? 'تم روشن' : 'تم تاریک'}
	disabled={!ready}
	onclick={toggleTheme}
>
	{#if isDark}
		<Moon class="h-4 w-4" aria-hidden="true" />
	{:else}
		<Sun class="h-4 w-4" aria-hidden="true" />
	{/if}
</button>
