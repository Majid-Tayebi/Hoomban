<script lang="ts">
	import Input from '$lib/components/ui/input.svelte';
	import { formatAmount, parseAmount } from '$lib/money';
	import { cn } from '$lib/utils';

	let {
		value = $bindable(0),
		class: className = '',
		...restProps
	}: {
		value?: number;
		class?: string;
		[key: string]: unknown;
	} = $props();

	let draft = $state('');
	let focused = $state(false);

	$effect.pre(() => {
		if (!focused) {
			draft = value ? formatAmount(value) : '';
		}
	});

	function handleInput() {
		const n = parseAmount(draft);
		value = n;
		draft = n ? formatAmount(n) : '';
	}

	function handleFocus() {
		focused = true;
	}

	function handleBlur() {
		focused = false;
		const n = parseAmount(draft);
		value = n;
		draft = n ? formatAmount(n) : '';
	}
</script>

<Input
	type="text"
	inputmode="numeric"
	dir="ltr"
	class={cn('tabular-nums', className)}
	bind:value={draft}
	onfocus={handleFocus}
	onblur={handleBlur}
	oninput={handleInput}
	{...restProps}
/>
