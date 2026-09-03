<script lang="ts">
	import StatefulButton from '$lib/components/ui/stateful-button.svelte';
	import { cn } from '$lib/utils';

	let {
		mobile = $bindable(''),
		error = '',
		showError = false,
		title = undefined as string | undefined,
		subtitle = undefined as string | undefined,
		submitLabel = 'ارسال کد',
		onSubmit
	}: {
		mobile?: string;
		error?: string;
		showError?: boolean;
		title?: string;
		subtitle?: string;
		submitLabel?: string;
		onSubmit: () => void | Promise<void>;
	} = $props();

	const fieldClass =
		'my-2 w-full rounded-xl border-0 bg-muted px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus:bg-muted/80 focus:ring-2 focus:ring-primary/25';
</script>

{#if title}
	<h2 class="text-3xl font-semibold leading-tight tracking-tight text-foreground">
		{title}
	</h2>
{/if}

{#if subtitle}
	<span class="my-5 text-xs text-muted-foreground">{subtitle}</span>
{/if}

<input
	type="tel"
	inputmode="numeric"
	autocomplete="tel"
	bind:value={mobile}
	placeholder="0912xxxxxxx"
	dir="ltr"
	class={cn(fieldClass, 'w-full text-left tracking-wide')}
/>

{#if showError && error}
	<p class="mt-2 w-full text-center text-xs text-destructive" role="alert">{error}</p>
{/if}

<StatefulButton class="mt-2.5 w-full" onclick={onSubmit}>{submitLabel}</StatefulButton>
