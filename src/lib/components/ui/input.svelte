<script lang="ts">
	import type { Component } from 'svelte';
	import { Eye, EyeOff, X } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	type InputVariant = 'default' | 'destructive' | 'ghost';
	type InputSize = 'default' | 'sm' | 'lg' | 'xl';

	const variantClasses: Record<InputVariant, string> = {
		default: 'border-border bg-background',
		destructive: 'border-destructive focus-visible:ring-destructive',
		ghost: 'border-transparent bg-muted/60 focus-visible:bg-muted focus-visible:border-border'
	};

	const sizeClasses: Record<InputSize, string> = {
		default: 'h-11 px-3 py-2 text-base sm:text-sm',
		sm: 'h-8 px-2 py-1 text-xs',
		lg: 'h-10 px-4 py-2 text-sm',
		xl: 'h-12 px-6 py-3 text-base'
	};

	let {
		class: className = '',
		type = 'text',
		variant = 'default',
		size = 'default',
		value = $bindable('' as string | number),
		leftIcon,
		rightIcon,
		error = false,
		clearable = false,
		onClear,
		...restProps
	}: {
		class?: string;
		type?: string;
		variant?: InputVariant;
		size?: InputSize;
		value?: string | number;
		leftIcon?: Component;
		rightIcon?: Component;
		error?: boolean;
		clearable?: boolean;
		onClear?: () => void;
		[key: string]: unknown;
	} = $props();

	let showPassword = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	const inputVariant = $derived(error ? 'destructive' : variant);
	const isPassword = $derived(type === 'password');
	const actualType = $derived(isPassword && showPassword ? 'text' : type);
	const stringValue = $derived(value == null ? '' : String(value));
	const showClearButton = $derived(clearable && stringValue.length > 0);

	const LeftIcon = $derived(leftIcon);
	const RightIcon = $derived(rightIcon);

	function handleClear() {
		value = '';
		onClear?.();
		inputEl?.focus();
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
</script>

<div class="relative flex w-full max-w-full">
	{#if LeftIcon}
		<div
			class={cn(
				'pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-muted-foreground [&_svg]:shrink-0',
				size === 'sm' ? 'start-2 [&_svg]:size-3.5' : 'start-3 [&_svg]:size-4'
			)}
		>
			<LeftIcon class={size === 'sm' ? 'size-3.5' : 'size-4'} aria-hidden="true" />
		</div>
	{/if}

	<input
		bind:this={inputEl}
		bind:value
		type={actualType}
		class={cn(
			'flex w-full rounded-xl border shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
			variantClasses[inputVariant],
			sizeClasses[size],
			LeftIcon && (size === 'sm' ? 'ps-7' : 'ps-10'),
			(RightIcon || isPassword || showClearButton) && (size === 'sm' ? 'pe-7' : 'pe-10'),
			className
		)}
		{...restProps}
	/>

	{#if RightIcon || isPassword || showClearButton}
		<div
			class={cn(
				'absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-1',
				size === 'sm' ? 'end-2' : 'end-3'
			)}
		>
			{#if RightIcon}
				<div class={cn('text-muted-foreground [&_svg]:shrink-0', size === 'sm' ? '[&_svg]:size-3.5' : '[&_svg]:size-4')}>
					<RightIcon class={size === 'sm' ? 'size-3.5' : 'size-4'} aria-hidden="true" />
				</div>
			{/if}

			{#if showClearButton}
				<button
					type="button"
					class="text-muted-foreground transition-colors duration-200 hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0"
					tabindex={-1}
					aria-label="پاک کردن"
					onclick={handleClear}
				>
					<X class="size-4" />
				</button>
			{/if}

			{#if isPassword}
				<button
					type="button"
					class="text-muted-foreground transition-colors duration-200 hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0"
					tabindex={-1}
					aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
					onclick={togglePasswordVisibility}
				>
					{#if showPassword}
						<EyeOff class="size-4" />
					{:else}
						<Eye class="size-4" />
					{/if}
				</button>
			{/if}
		</div>
	{/if}
</div>
