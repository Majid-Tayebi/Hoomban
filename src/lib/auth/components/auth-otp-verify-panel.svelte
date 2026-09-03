<script lang="ts">
	import type { UserRole } from '$lib/auth.svelte';
	import OTPInput from '$lib/components/ui/otp-input.svelte';
	import StatefulButton from '$lib/components/ui/stateful-button.svelte';
	import { OTP_CODE_LENGTH, normalizeOtpCode } from '$lib/otp';

	let {
		otp = $bindable(''),
		otpError = $bindable(false),
		error = '',
		showError = false,
		storedMobile,
		otpDisplayCode = undefined as string | undefined,
		detectedRole = null as UserRole | null,
		detectedName = '',
		roleActionLabel = 'ورود',
		showHeading = false,
		canResendOtp,
		resendingOtp,
		otpResendRemaining,
		otpResendProgress,
		isLoading,
		onClearError,
		onResend,
		onChangeMobile,
		onVerify
	}: {
		otp?: string;
		otpError?: boolean;
		error?: string;
		showError?: boolean;
		storedMobile: string;
		otpDisplayCode?: string;
		detectedRole?: UserRole | null;
		detectedName?: string;
		roleActionLabel?: string;
		showHeading?: boolean;
		canResendOtp: boolean;
		resendingOtp: boolean;
		otpResendRemaining: number;
		otpResendProgress: number;
		isLoading: boolean;
		onClearError: () => void;
		onResend: () => void | Promise<void>;
		onChangeMobile: () => void;
		onVerify: (code?: string) => Promise<boolean>;
	} = $props();

	function roleLabel(role: UserRole) {
		const labels: Record<UserRole, string> = {
			patient: 'مراجع',
			doctor: 'روانشناس',
			secretary: 'منشی',
			admin: 'مدیر',
			writer: 'نویسنده'
		};
		return labels[role];
	}
</script>

<div class="flex w-full max-w-sm flex-col items-center">
	{#if showHeading}
		<h2 class="text-3xl font-semibold leading-tight tracking-tight text-foreground">
			تایید شماره موبایل
		</h2>
		<p class="my-3 text-xs text-muted-foreground">
			کد به <span dir="ltr">{storedMobile}</span> ارسال شد
		</p>
	{:else}
		<p class="mb-3 text-xs text-muted-foreground">
			کد به <span dir="ltr">{storedMobile}</span> ارسال شد
		</p>
	{/if}

	{#if otpDisplayCode}
		<p class="mb-3 text-center text-sm text-muted-foreground">
			کد تأیید:
			<span
				dir="ltr"
				class="mr-1 inline-block font-semibold tracking-[0.35em] text-foreground tabular-nums"
			>
				{otpDisplayCode}
			</span>
		</p>
	{/if}

	{#if detectedRole}
		<div
			class="mb-3 w-full rounded-xl bg-accent/70 px-3 py-2 text-center text-xs text-accent-foreground"
		>
			{roleActionLabel} — <strong>{roleLabel(detectedRole)}</strong>
			{#if detectedName}
				<span class="text-muted-foreground"> / {detectedName}</span>
			{/if}
		</div>
	{/if}

	<div class="py-2" dir="ltr">
		<OTPInput
			length={OTP_CODE_LENGTH}
			onComplete={(value) => {
				const code = normalizeOtpCode(value);
				otp = code;
				if (code.length === OTP_CODE_LENGTH) void onVerify(code);
			}}
			onValueChange={(value) => {
				otp = normalizeOtpCode(value);
				otpError = false;
				onClearError();
			}}
			disabled={isLoading}
			error={otpError}
		/>
	</div>

	{#if showError && error}
		<p class="mt-2 text-center text-xs text-destructive" role="alert">{error}</p>
	{/if}

	<div class="mt-4 w-full space-y-2">
		<div class="flex items-center justify-between gap-3 text-xs">
			<span class="text-muted-foreground">کد را دریافت نکردید؟</span>
			{#if canResendOtp}
				<button
					type="button"
					class="shrink-0 font-semibold text-primary transition-colors duration-200 hover:text-primary/80 disabled:opacity-50"
					disabled={resendingOtp}
					onclick={onResend}
				>
					{resendingOtp ? 'در حال ارسال...' : 'ارسال مجدد کد'}
				</button>
			{:else}
				<span class="shrink-0 tabular-nums text-muted-foreground">
					{otpResendRemaining.toLocaleString('fa-IR')} ثانیه
				</span>
			{/if}
		</div>
		<div
			class="h-1 w-full overflow-hidden rounded-full bg-muted"
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(otpResendProgress)}
			aria-label="زمان تا ارسال مجدد کد"
		>
			<div
				class="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
				style:width="{otpResendProgress}%"
			></div>
		</div>
	</div>

	<div class="mt-2 flex w-full gap-2">
		<button
			type="button"
			class="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
			disabled={isLoading}
			onclick={onChangeMobile}
		>
			تغییر شماره
		</button>
		<StatefulButton
			class="flex-1 !px-3"
			disabled={isLoading || normalizeOtpCode(otp).length !== OTP_CODE_LENGTH}
			onclick={async () => {
				const ok = await onVerify();
				if (!ok) throw new Error('verify failed');
			}}
		>
			تأیید و ورود
		</StatefulButton>
	</div>
</div>
