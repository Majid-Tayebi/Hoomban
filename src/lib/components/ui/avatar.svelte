<script lang="ts">
	import { type Snippet } from "svelte";
	import { cn } from "$lib/utils";

	let { class: className = "", src = "", alt = "", children, ...restProps }: { class?: string; src?: string; alt?: string; children?: Snippet; [key: string]: any } = $props();
</script>

<div class={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...restProps}>
	{#if src}
		<img class="aspect-square h-full w-full" src={src} alt={alt} />
	{:else if children}
		{@render children()}
	{:else}
		<div class="flex h-full w-full items-center justify-center rounded-full bg-muted">
			<span class="text-sm font-medium">?</span>
		</div>
	{/if}
</div>
