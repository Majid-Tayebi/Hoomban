<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		length = 6,
		onComplete = (_value: string) => {},
		onValueChange = (_value: string) => {},
		disabled = false,
		error = false,
		class: className = ''
	}: {
		length?: number;
		onComplete?: (value: string) => void;
		onValueChange?: (value: string) => void;
		disabled?: boolean;
		error?: boolean;
		class?: string;
	} = $props();

	let values = $state<string[]>([]);
	let inputRefs: HTMLInputElement[] = [];

	$effect(() => {
		if (values.length !== length) {
			values = Array.from({ length }, (_, i) => values[i] ?? '');
		}
	});

	function focusInput(index: number) {
		inputRefs[index]?.focus();
	}

	function handleChange(index: number, value: string) {
		if (disabled) return;

		const newValue = value.replace(/[^0-9]/g, '').slice(-1);
		const newValues = [...values];
		newValues[index] = newValue;
		values = newValues;
		onValueChange(newValues.join(''));

		if (newValue && index < length - 1) {
			focusInput(index + 1);
		}

		if (newValues.every((val) => val !== '') && newValues.length === length) {
			onComplete(newValues.join(''));
		}
	}

	function handleKeyDown(index: number, e: KeyboardEvent) {
		if (disabled) return;

		if (e.key === 'Backspace') {
			e.preventDefault();
			const newValues = [...values];

			if (values[index]) {
				newValues[index] = '';
				values = newValues;
				onValueChange(newValues.join(''));
			} else if (index > 0) {
				newValues[index - 1] = '';
				values = newValues;
				onValueChange(newValues.join(''));
				focusInput(index - 1);
			}
		} else if (e.key === 'ArrowLeft' && index > 0) {
			focusInput(index - 1);
		} else if (e.key === 'ArrowRight' && index < length - 1) {
			focusInput(index + 1);
		}
	}

	function handlePaste(e: ClipboardEvent) {
		if (disabled) return;

		e.preventDefault();
		const pastedData = e.clipboardData?.getData('text/plain').replace(/[^0-9]/g, '') || '';
		const pastedValues = pastedData.slice(0, length).split('');

		const newValues = new Array(length).fill('');
		pastedValues.forEach((value, i) => {
			if (i < length) newValues[i] = value;
		});

		values = newValues;
		onValueChange(newValues.join(''));

		const nextEmptyIndex = newValues.findIndex((val) => val === '');
		focusInput(nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1);

		if (newValues.every((val) => val !== '')) {
			onComplete(newValues.join(''));
		}
	}

	function handleFocus(index: number) {
		inputRefs[index]?.select();
	}
</script>

<div
	class={cn(
		'flex w-full justify-center',
		length >= 6 ? 'gap-1 sm:gap-1.5' : 'gap-2 sm:gap-2.5',
		className
	)}
	dir="ltr"
>
	{#each values as value, index}
		<input
			bind:this={inputRefs[index]}
			type="text"
			inputmode="numeric"
			autocomplete={index === 0 ? 'one-time-code' : 'off'}
			pattern="[0-9]*"
			maxlength={1}
			{value}
			aria-label="رقم {index + 1} از {length}"
			oninput={(e) => handleChange(index, (e.currentTarget as HTMLInputElement).value)}
			onkeydown={(e) => handleKeyDown(index, e)}
			onpaste={handlePaste}
			onfocus={() => handleFocus(index)}
			{disabled}
			class="
				rounded-xl border bg-background text-center font-semibold
				text-foreground transition-colors
				focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
				disabled:cursor-not-allowed disabled:opacity-50
				{length >= 6 ? 'h-11 w-9 text-base sm:h-12 sm:w-10 sm:text-lg' : 'h-12 w-11 text-lg sm:h-12 sm:w-12'}
				{error
					? 'border-destructive focus:border-destructive focus:ring-destructive'
					: 'border-input hover:border-border focus:border-ring'}
			"
		/>
	{/each}
</div>
