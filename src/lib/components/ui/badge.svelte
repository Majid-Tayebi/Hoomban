<script lang="ts">
	import { type Snippet } from "svelte";
	import { cn } from "$lib/utils";

	let { class: className = "", variant = "default", children, ...restProps }: { class?: string; variant?: "default" | "secondary" | "destructive" | "outline"; children: Snippet; [key: string]: any } = $props();

	const badgeVariants = {
		default: "bg-primary text-primary-foreground hover:bg-primary/80",
		secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
		outline: "text-foreground",
	};
</script>

<div class={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", badgeVariants[variant], className)} {...restProps}>
	{@render children()}
</div>
