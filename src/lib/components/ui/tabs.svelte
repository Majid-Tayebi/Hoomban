<script lang="ts">
	import { type Snippet } from "svelte";
	import { cn } from "$lib/utils";

	let { class: className = "", children, ...restProps }: { class?: string; children: Snippet; [key: string]: any } = $props();
</script>

<div class={cn("w-full", className)} {...restProps}>
	{@render children()}
</div>
