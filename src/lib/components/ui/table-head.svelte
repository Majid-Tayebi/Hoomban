<script lang="ts">
	import { type Snippet } from "svelte";
	import { cn } from "$lib/utils";

	let { class: className = "", children, ...restProps }: { class?: string; children: Snippet; [key: string]: any } = $props();
</script>

<th class={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...restProps}>
	{@render children()}
</th>
