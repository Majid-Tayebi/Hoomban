<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { X } from '@lucide/svelte';

	let {
		showSignUp,
		onSignIn,
		onSignUp,
		onClose,
		children
	}: {
		showSignUp: boolean;
		onSignIn: () => void;
		onSignUp: () => void;
		onClose: () => void;
		children: Snippet;
	} = $props();

	const toggleBtnClass =
		'mt-2.5 rounded-full border border-primary-foreground/75 px-10 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/10';
</script>

<!-- mobile switch -->
<div class="mb-4 flex w-full max-w-[768px] gap-2 md:hidden">
	<button
		type="button"
		class={cn(
			'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200',
			!showSignUp
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground hover:bg-muted/80'
		)}
		onclick={onSignIn}
	>
		ورود
	</button>
	<button
		type="button"
		class={cn(
			'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200',
			showSignUp
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground hover:bg-muted/80'
		)}
		onclick={onSignUp}
	>
		ثبت‌نام
	</button>
</div>

<div
	class={cn(
		'relative w-full max-w-[768px] overflow-hidden rounded-[30px] bg-card text-card-foreground shadow-[0_8px_32px_hsl(var(--primary)/0.12)] md:min-h-[520px]',
		showSignUp && 'auth-active'
	)}
	dir="ltr"
>
	<button
		type="button"
		class="absolute top-4 right-4 z-[1100] flex h-9 w-9 items-center justify-center rounded-full bg-muted/90 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
		aria-label="بستن و بازگشت به صفحه اصلی"
		onclick={onClose}
	>
		<X class="h-5 w-5" />
	</button>

	{@render children()}

	<!-- sliding toggle (desktop) -->
	<div
		class={cn(
			'absolute top-0 left-1/2 z-[1000] hidden h-full w-1/2 overflow-hidden rounded-[20px] transition-transform duration-[600ms] ease-in-out md:block',
			showSignUp && '-translate-x-full'
		)}
	>
		<div
			class={cn(
				'relative -left-full h-full w-[200%] bg-gradient-to-br from-primary via-primary to-[hsl(206,46%,55%)] text-primary-foreground transition-transform duration-[600ms] ease-in-out',
				showSignUp && 'translate-x-1/2'
			)}
		>
			<!-- left panel: visible when sign-up active -->
			<div
				class={cn(
					'absolute top-0 flex h-full w-1/2 -translate-x-[200%] flex-col items-center justify-center px-8 text-center transition-transform duration-[600ms] ease-in-out',
					showSignUp && 'translate-x-0'
				)}
			>
				<h2 class="text-3xl font-semibold leading-tight tracking-tight">خوش برگشتی</h2>
				<p class="my-5 text-sm leading-6 opacity-95">قبلاً ثبت‌نام کردی؟ با نام کاربری وارد شو</p>
				<button type="button" class={toggleBtnClass} onclick={onSignIn}>ورود</button>
			</div>

			<!-- right panel: visible when sign-in active -->
			<div
				class={cn(
					'absolute right-0 top-0 flex h-full w-1/2 flex-col items-center justify-center px-8 text-center transition-transform duration-[600ms] ease-in-out',
					showSignUp && 'translate-x-[200%]'
				)}
			>
				<h2 class="text-3xl font-semibold leading-tight tracking-tight">سلام</h2>
				<p class="my-5 text-sm leading-6 opacity-95">
					حساب کاربری نداری؟ با موبایل ثبت‌نام کن و وارد کلینیک شو
				</p>
				<button type="button" class={toggleBtnClass} onclick={onSignUp}>ثبت‌نام</button>
			</div>
		</div>
	</div>
</div>
