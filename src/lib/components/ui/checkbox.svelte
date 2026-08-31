<script lang="ts">
	import { cn } from "$lib/utils";

	let { class: className = "", checked = false, ...restProps }: { class?: string; checked?: boolean; [key: string]: any } = $props();
</script>

<input
	type="checkbox"
	checked={checked}
	class={cn("h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary", className)}
	{...restProps}
/>
