<script lang="ts">
	import { type Snippet } from "svelte";
	import { cn } from "$lib/utils";

	let { class: className = "", value = "", children, ...restProps }: { class?: string; value?: string; children: Snippet; [key: string]: any } = $props();
</script>

<div
	class={cn(
		"mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
		className
	)}
	data-value={value}
	{...restProps}
>
	{@render children()}
</div>
