<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { Loader2, CircleCheck } from '@lucide/svelte';

	type Phase = 'idle' | 'loading' | 'success';

	let {
		children,
		class: className = '',
		variant = 'primary',
		disabled = false,
		type = 'button',
		onclick,
		...restProps
	}: {
		children: Snippet;
		class?: string;
		variant?: 'primary' | 'outline';
		disabled?: boolean;
		type?: 'button' | 'submit';
		onclick?: (event: MouseEvent) => void | Promise<void>;
		[key: string]: unknown;
	} = $props();

	let phase = $state<Phase>('idle');

	const busy = $derived(disabled || phase !== 'idle');

	const variants = {
		primary:
			'bg-primary text-primary-foreground hover:bg-primary/90 hover:ring-2 hover:ring-primary/40 ring-offset-2 ring-offset-background',
		outline:
			'border border-primary-foreground/75 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:ring-2 hover:ring-primary-foreground/30 ring-offset-2 ring-offset-primary'
	};

	async function handleClick(event: MouseEvent) {
		if (busy || !onclick) return;

		phase = 'loading';
		try {
			await onclick(event);
			phase = 'success';
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch {
			/* caller shows error message */
		} finally {
			phase = 'idle';
		}
	}
</script>

<button
	{type}
	disabled={busy}
	class={cn(
		'inline-flex min-w-[7.5rem] cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60',
		variants[variant],
		className
	)}
	onclick={handleClick}
	{...restProps}
>
	{#if phase === 'loading'}
		<Loader2 class="h-5 w-5 shrink-0 animate-spin" aria-hidden="false" />
	{:else if phase === 'success'}
		<CircleCheck class="h-5 w-5 shrink-0" aria-hidden="false" />
	{/if}
	<span class="truncate">{@render children()}</span>
</button>
