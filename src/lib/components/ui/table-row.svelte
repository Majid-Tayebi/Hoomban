<script lang="ts">
	import { type Snippet } from "svelte";
	import { cn } from "$lib/utils";

	let { class: className = "", children, ...restProps }: { class?: string; children: Snippet; [key: string]: any } = $props();
</script>

<tr class={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...restProps}>
	{@render children()}
</tr>
