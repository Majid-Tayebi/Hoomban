<script lang="ts">
	import { type Snippet } from "svelte";
	import { cn } from "$lib/utils";

	let { class: className = "", children, ...restProps }: { class?: string; children: Snippet; [key: string]: any } = $props();
</script>

<div class={cn("w-full overflow-auto", className)} {...restProps}>
	<table class="w-full caption-bottom text-sm">
		{@render children()}
	</table>
</div>
