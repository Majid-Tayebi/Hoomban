<script lang="ts">
	import type { Snippet } from 'svelte';
	import StatefulButton from '$lib/components/ui/stateful-button.svelte';
	import { cn } from '$lib/utils';

	type SignInMethod = 'credentials' | 'mobile';

	let {
		signInMethod = $bindable('credentials' as SignInMethod),
		usernameLocal = $bindable(''),
		password = $bindable(''),
		error = '',
		showError = false,
		mobileStep,
		onSubmit,
		onForgotPassword,
		onMethodChange
	}: {
		signInMethod?: SignInMethod;
		usernameLocal?: string;
		password?: string;
		error?: string;
		showError?: boolean;
		mobileStep: Snippet;
		onSubmit: () => void | Promise<void>;
		onForgotPassword: () => void;
		onMethodChange: (method: SignInMethod) => void;
	} = $props();

	const fieldClass =
		'my-2 w-full rounded-xl border-0 bg-muted px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus:bg-muted/80 focus:ring-2 focus:ring-primary/25';

	const tabClass = (active: boolean) =>
		cn(
			'flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold leading-snug transition-all duration-200 sm:text-xs',
			active
				? 'bg-card text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'
		);
</script>

<h2 class="text-3xl font-semibold leading-tight tracking-tight text-foreground">ورود</h2>

<div class="my-5 flex w-full gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label="روش ورود">
	<button
		type="button"
		role="tab"
		aria-selected={signInMethod === 'credentials'}
		class={tabClass(signInMethod === 'credentials')}
		onclick={() => onMethodChange('credentials')}
	>
		ورود با نام کاربری و رمز عبور
	</button>
	<button
		type="button"
		role="tab"
		aria-selected={signInMethod === 'mobile'}
		class={tabClass(signInMethod === 'mobile')}
		onclick={() => onMethodChange('mobile')}
	>
		ورود با شماره موبایل
	</button>
</div>

{#if signInMethod === 'credentials'}
	<div class="w-full" dir="ltr">
		<div class="my-2 flex h-11 w-full items-center overflow-hidden rounded-xl bg-muted">
			<div
				class="flex h-full shrink-0 items-center bg-muted/80 px-3 text-sm font-medium text-muted-foreground"
			>
				@
			</div>
			<input
				bind:value={usernameLocal}
				autocomplete="username"
				placeholder="نام کاربری"
				class="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-foreground outline-none"
			/>
		</div>
		<input
			type="password"
			bind:value={password}
			autocomplete="current-password"
			placeholder="رمز عبور"
			class={fieldClass}
		/>
	</div>

	{#if showError && error}
		<p class="mt-2 w-full text-center text-xs text-destructive" role="alert">{error}</p>
	{/if}

	<StatefulButton class="mt-2.5 w-full" onclick={onSubmit}>ورود</StatefulButton>

	<button
		type="button"
		class="mt-4 text-[13px] text-foreground transition-colors duration-200 hover:text-primary"
		onclick={onForgotPassword}
	>
		فراموشی رمز عبور؟
	</button>
{:else}
	{@render mobileStep()}
{/if}
