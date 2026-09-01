<script lang="ts">
	import { loginRedirectUrl, sanitizeAuthRedirect } from '$lib/auth-redirect';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { pb } from '$lib/pocketbase';
	import {
		getUser,
		isAuthHydrated,
		resolveRoleForMobile,
		requestLoginOtp,
		verifyLoginOtp,
		loginWithCredentials,
		type UserRole
	} from '$lib/auth.svelte';
	import OTPInput from '$lib/components/ui/otp-input.svelte';
	import StatefulButton from '$lib/components/ui/stateful-button.svelte';
	import { OTP_CODE_LENGTH, OTP_RESEND_SECONDS, normalizeOtpCode } from '$lib/otp';
	import { cn } from '$lib/utils';
	import { X } from '@lucide/svelte';

	let { data } = $props();

	let showSignUp = $state(false);
	let recoveryMode = $state(false);

	let mobile = $state('');
	let usernameLocal = $state('');
	let password = $state('');
	let otp = $state('');
	let otpStep = $state(1);
	let isLoading = $state(false);
	let error = $state('');
	let otpError = $state(false);
	let storedMobile = $state('');
	let detectedRole = $state<UserRole | null>(null);
	let detectedName = $state('');
	let otpSentAt = $state<number | null>(null);
	let resendTick = $state(Date.now());
	let resendingOtp = $state(false);
	/** Shown only in dev/Sandbox when SMS does not reach the phone. */
	let otpDisplayCode = $state<string | undefined>();
	let verifyingOtp = $state(false);

	type SignInMethod = 'credentials' | 'mobile';
	let signInMethod = $state<SignInMethod>('credentials');

	const MOBILE_REGEX = /^09\d{9}$/;

	let user = $derived(getUser());
	let hydrated = $derived(isAuthHydrated());
	let postLoginPath = $derived.by(() => {
		const redirect = $page.url.searchParams.get('redirect');
		return sanitizeAuthRedirect(redirect);
	});

	$effect(() => {
		if (!browser || !hydrated || !user) return;
		void goto(postLoginPath, { invalidateAll: true });
	});

	function normalizeMobile(value: string) {
		const digits = value.replace(/\D/g, '');
		if (digits.startsWith('98') && digits.length === 12) return '0' + digits.slice(2);
		if (digits.startsWith('9') && digits.length === 10) return '0' + digits;
		return digits;
	}

	function validateMobile(value: string) {
		const clean = normalizeMobile(value);
		if (!MOBILE_REGEX.test(clean)) {
			error = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود';
			return null;
		}
		return clean;
	}

	async function checkConnection() {
		try {
			await pb.health.check();
			return true;
		} catch {
			return false;
		}
	}

	function pbErrorMessage(err: unknown, fallback: string) {
		if (err instanceof Error) return err.message || fallback;
		const e = err as {
			message?: string;
			data?: { message?: string; data?: Record<string, { message?: string }> };
		};
		const fieldErrors = e?.data?.data;
		if (fieldErrors) {
			const first = Object.values(fieldErrors).find((f) => f?.message)?.message;
			if (first) return first;
		}
		return e?.data?.message || e?.message || fallback;
	}

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

	function resetOtpFlow() {
		otpStep = 1;
		otp = '';
		storedMobile = '';
		detectedRole = null;
		detectedName = '';
		otpError = false;
		otpSentAt = null;
		otpDisplayCode = undefined;
	}

	function openSignIn() {
		showSignUp = false;
		recoveryMode = false;
		signInMethod = 'credentials';
		error = '';
		resetOtpFlow();
	}

	function openSignUp(isRecovery = false) {
		showSignUp = true;
		recoveryMode = isRecovery;
		error = '';
		resetOtpFlow();
	}

	$effect(() => {
		if (otpStep !== 2 || !otpSentAt) return;
		const id = setInterval(() => {
			resendTick = Date.now();
		}, 1000);
		return () => clearInterval(id);
	});

	const otpResendRemaining = $derived.by(() => {
		if (!otpSentAt) return OTP_RESEND_SECONDS;
		const elapsed = Math.floor((resendTick - otpSentAt) / 1000);
		return Math.max(0, OTP_RESEND_SECONDS - elapsed);
	});

	const canResendOtp = $derived(otpStep === 2 && otpResendRemaining === 0 && !resendingOtp);

	const otpResendProgress = $derived.by(() => {
		if (!otpSentAt) return 0;
		const elapsed = resendTick - otpSentAt;
		return Math.min(100, (elapsed / (OTP_RESEND_SECONDS * 1000)) * 100);
	});

	async function requestOtpCode(mobileValue: string) {
		const otpMode = recoveryMode ? 'recovery' : 'login';
		const result = await requestLoginOtp(mobileValue, otpMode);
		detectedRole = result.role || null;
		detectedName = result.name || '';
		storedMobile = mobileValue;
		otpStep = 2;
		otp = '';
		otpError = false;
		otpSentAt = Date.now();
		otpDisplayCode = result.demoCode;
	}

	async function sendOTP() {
		error = '';
		detectedRole = null;
		detectedName = '';
		const cleanMobile = validateMobile(mobile);
		if (!cleanMobile) throw new Error('validation');

		try {
			const connected = await checkConnection();
			if (!connected) {
				error = 'اتصال به سرور برقرار نیست. PocketBase را اجرا کنید.';
				throw new Error('offline');
			}

			await requestOtpCode(cleanMobile);
		} catch (err: unknown) {
			if (err instanceof Error && ['validation', 'offline'].includes(err.message)) throw err;
			error = pbErrorMessage(err, 'ارسال کد ناموفق بود');
			throw err;
		}
	}

	async function resendOTP() {
		if (!storedMobile || !canResendOtp) return;
		error = '';
		resendingOtp = true;
		try {
			const connected = await checkConnection();
			if (!connected) {
				error = 'اتصال به سرور برقرار نیست.';
				throw new Error('offline');
			}
			await requestOtpCode(storedMobile);
		} catch (err: unknown) {
			if (err instanceof Error && err.message === 'offline') throw err;
			const e = err as Error & { resendAfterSeconds?: number };
			if (e.resendAfterSeconds && otpSentAt) {
				otpSentAt = Date.now() - (OTP_RESEND_SECONDS - e.resendAfterSeconds) * 1000;
			}
			error = pbErrorMessage(err, 'ارسال مجدد ناموفق بود');
		} finally {
			resendingOtp = false;
		}
	}

	async function verifyOTP(submittedCode?: string): Promise<boolean> {
		if (verifyingOtp || isLoading) return false;

		const normalizedOtp = normalizeOtpCode(submittedCode ?? otp);
		if (normalizedOtp.length !== OTP_CODE_LENGTH) {
			error = `کد ${OTP_CODE_LENGTH.toLocaleString('fa-IR')} رقمی را کامل وارد کنید`;
			otpError = true;
			return false;
		}

		verifyingOtp = true;
		isLoading = true;
		error = '';
		otpError = false;

		try {
			const cleanMobile = storedMobile || validateMobile(mobile);
			if (!cleanMobile) return false;

			const connected = await checkConnection();
			if (!connected) {
				error = 'اتصال به سرور برقرار نیست.';
				otpError = true;
				return false;
			}

			const resolved = detectedRole
				? { role: detectedRole, name: detectedName }
				: await resolveRoleForMobile(cleanMobile);

			await verifyLoginOtp(cleanMobile, normalizedOtp, {
				role: resolved.role,
				name: resolved.name
			});
			await goto(postLoginPath, { invalidateAll: true });
			return true;
		} catch (err: unknown) {
			error = pbErrorMessage(err, 'خطا در ورود. دوباره تلاش کنید.');
			otpError = true;
			return false;
		} finally {
			verifyingOtp = false;
			isLoading = false;
		}
	}

	async function submitCredentials() {
		error = '';
		if (!usernameLocal.trim() || !password) {
			error = 'نام کاربری و رمز عبور را وارد کنید';
			throw new Error('validation');
		}

		try {
			const connected = await checkConnection();
			if (!connected) {
				error = 'اتصال به سرور برقرار نیست.';
				throw new Error('offline');
			}
			await loginWithCredentials(usernameLocal.trim(), password);
			await goto('/dashboard');
		} catch (err: unknown) {
			if (err instanceof Error && ['validation', 'offline'].includes(err.message)) throw err;
			error = pbErrorMessage(err, 'ورود ناموفق بود');
			throw err;
		}
	}

	async function quickDevLogin(username: string) {
		error = '';
		isLoading = true;
		try {
			const connected = await checkConnection();
			if (!connected) {
				error = 'PocketBase در دسترس نیست.';
				return;
			}
			await loginWithCredentials(username, data.devLoginPassword ?? '');
			await goto('/dashboard');
		} catch (err: unknown) {
			error = pbErrorMessage(err, 'ورود سریع ناموفق بود');
		} finally {
			isLoading = false;
		}
	}

	const fieldClass =
		'my-2 w-full rounded-xl border-0 bg-muted px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus:bg-muted/80 focus:ring-2 focus:ring-primary/25';

	const toggleBtnClass =
		'mt-2.5 rounded-full border border-primary-foreground/75 px-10 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/10';

	const signInTabClass = (active: boolean) =>
		cn(
			'flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold leading-snug transition-all duration-200 sm:text-xs',
			active
				? 'bg-card text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'
		);

	function switchSignInMethod(method: SignInMethod) {
		signInMethod = method;
		recoveryMode = false;
		error = '';
		if (method === 'credentials') resetOtpFlow();
	}
</script>

<div
	class="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8 safe-top safe-bottom
		bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border)/0.45)_1px,transparent_0)]
		bg-[length:28px_28px]"
	dir="rtl"
>
	<!-- mobile switch -->
	<div class="mb-4 flex w-full max-w-[768px] gap-2 md:hidden">
		<button
			type="button"
			class={cn(
				'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200',
				!showSignUp ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
			)}
			onclick={openSignIn}
		>
			ورود
		</button>
		<button
			type="button"
			class={cn(
				'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200',
				showSignUp ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
			)}
			onclick={() => openSignUp(false)}
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
			onclick={() => goto('/')}
		>
			<X class="h-5 w-5" />
		</button>
		<!-- sign in -->
		<div
			class={cn(
				'flex flex-col items-center justify-center bg-card px-8 py-10 md:absolute md:top-0 md:left-0 md:z-[2] md:h-full md:w-1/2 md:py-0',
				'transition-all duration-[600ms] ease-in-out',
				showSignUp && 'max-md:hidden md:translate-x-full'
			)}
		>
			<form
				class="flex w-full max-w-sm flex-col items-center"
				onsubmit={(e) => e.preventDefault()}
			>
				<h2 class="text-3xl font-semibold leading-tight tracking-tight text-foreground">ورود</h2>

				<div class="my-5 flex w-full gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label="روش ورود">
					<button
						type="button"
						role="tab"
						aria-selected={signInMethod === 'credentials'}
						class={signInTabClass(signInMethod === 'credentials')}
						onclick={() => switchSignInMethod('credentials')}
					>
						ورود با نام کاربری و رمز عبور
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={signInMethod === 'mobile'}
						class={signInTabClass(signInMethod === 'mobile')}
						onclick={() => switchSignInMethod('mobile')}
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

				{#if error && !showSignUp && signInMethod === 'credentials'}
					<p class="mt-2 w-full text-center text-xs text-destructive" role="alert">{error}</p>
				{/if}

				<StatefulButton class="mt-2.5 w-full" onclick={submitCredentials}>ورود</StatefulButton>

				<button
					type="button"
					class="mt-4 text-[13px] text-foreground transition-colors duration-200 hover:text-primary"
					onclick={() => openSignUp(true)}
				>
					فراموشی رمز عبور؟
				</button>
				{:else if otpStep === 1}
					<input
						type="tel"
						inputmode="numeric"
						autocomplete="tel"
						bind:value={mobile}
						placeholder="0912xxxxxxx"
						dir="ltr"
						class={cn(fieldClass, 'w-full text-left tracking-wide')}
					/>

					{#if error && !showSignUp && signInMethod === 'mobile'}
						<p class="mt-2 w-full text-center text-xs text-destructive" role="alert">{error}</p>
					{/if}

					<StatefulButton class="mt-2.5 w-full" onclick={sendOTP}>ارسال کد</StatefulButton>
				{:else}
					<p class="mb-3 text-xs text-muted-foreground">
						کد به <span dir="ltr">{storedMobile}</span> ارسال شد
					</p>

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
						<div class="mb-3 w-full rounded-xl bg-accent/70 px-3 py-2 text-center text-xs text-accent-foreground">
							ورود — <strong>{roleLabel(detectedRole)}</strong>
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
								if (code.length === OTP_CODE_LENGTH) void verifyOTP(code);
							}}
							onValueChange={(value) => {
								otp = normalizeOtpCode(value);
								otpError = false;
								error = '';
							}}
							disabled={isLoading}
							error={otpError}
						/>
					</div>

					{#if error && !showSignUp && signInMethod === 'mobile'}
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
									onclick={resendOTP}
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
								style={`width: ${otpResendProgress}%`}
							></div>
						</div>
					</div>

					<div class="mt-2 flex w-full gap-2">
						<button
							type="button"
							class="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
							disabled={isLoading}
							onclick={resetOtpFlow}
						>
							تغییر شماره
						</button>
						<StatefulButton
							class="flex-1 !px-3"
							disabled={isLoading || normalizeOtpCode(otp).length !== OTP_CODE_LENGTH}
							onclick={async () => {
								const ok = await verifyOTP();
								if (!ok) throw new Error('verify failed');
							}}
						>
							تأیید و ورود
						</StatefulButton>
					</div>
				{/if}
			</form>
		</div>

		<!-- sign up / mobile -->
		<div
			class={cn(
				'flex flex-col items-center justify-center bg-card px-8 py-10 md:absolute md:top-0 md:left-0 md:z-[1] md:h-full md:w-1/2 md:py-0',
				'opacity-100 transition-all duration-[600ms] ease-in-out md:opacity-0',
				showSignUp && 'md:z-[5] md:translate-x-full md:opacity-100',
				!showSignUp && 'max-md:hidden'
			)}
		>
			{#if otpStep === 1}
				<form
					class="flex w-full max-w-sm flex-col items-center"
					onsubmit={(e) => e.preventDefault()}
				>
					<h2 class="text-3xl font-semibold leading-tight tracking-tight text-foreground">
						{recoveryMode ? 'بازیابی حساب' : 'ایجاد حساب'}
					</h2>
					<span class="my-5 text-xs text-muted-foreground">
						{recoveryMode
							? 'کد OTP به موبایل ثبت‌شده ارسال می‌شود'
							: 'ثبت‌نام یا ورود با شماره موبایل'}
					</span>

					<input
						type="tel"
						inputmode="numeric"
						autocomplete="tel"
						bind:value={mobile}
						placeholder="0912xxxxxxx"
						dir="ltr"
						class={cn(fieldClass, 'text-left tracking-wide')}
					/>

					{#if error && showSignUp}
						<p class="mt-2 w-full text-center text-xs text-destructive" role="alert">{error}</p>
					{/if}

					<StatefulButton class="mt-2.5 w-full" onclick={sendOTP}>
						{recoveryMode ? 'ارسال کد' : 'ثبت‌نام'}
					</StatefulButton>
				</form>
			{:else}
				<div class="flex w-full max-w-sm flex-col items-center">
					<h2 class="text-3xl font-semibold leading-tight tracking-tight text-foreground">
						تایید شماره موبایل
					</h2>
					<p class="my-3 text-xs text-muted-foreground">
						کد به <span dir="ltr">{storedMobile}</span> ارسال شد
					</p>

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
						<div class="mb-3 rounded-xl bg-accent/70 px-3 py-2 text-center text-xs text-accent-foreground">
							{recoveryMode ? 'بازیابی' : 'ورود'} — <strong>{roleLabel(detectedRole)}</strong>
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
								if (code.length === OTP_CODE_LENGTH) void verifyOTP(code);
							}}
							onValueChange={(value) => {
								otp = normalizeOtpCode(value);
								otpError = false;
								error = '';
							}}
							disabled={isLoading}
							error={otpError}
						/>
					</div>

					{#if error && showSignUp}
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
									onclick={resendOTP}
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
								style={`width: ${otpResendProgress}%`}
							></div>
						</div>
					</div>

					<div class="mt-2 flex w-full gap-2">
						<button
							type="button"
							class="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
							disabled={isLoading}
							onclick={resetOtpFlow}
						>
							تغییر شماره
						</button>
						<StatefulButton
							class="flex-1 !px-3"
							disabled={isLoading || normalizeOtpCode(otp).length !== OTP_CODE_LENGTH}
							onclick={async () => {
								const ok = await verifyOTP();
								if (!ok) throw new Error('verify failed');
							}}
						>
							تأیید و ورود
						</StatefulButton>
					</div>
				</div>
			{/if}
		</div>

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
					<p class="my-5 text-sm leading-6 opacity-95">
						قبلاً ثبت‌نام کردی؟ با نام کاربری وارد شو
					</p>
					<button type="button" class={toggleBtnClass} onclick={openSignIn}>ورود</button>
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
					<button type="button" class={toggleBtnClass} onclick={() => openSignUp(false)}>
						ثبت‌نام
					</button>
				</div>
			</div>
		</div>
	</div>

	{#if data.devDemoAuth && data.devLoginPassword}
	<details class="mt-6 w-full max-w-[768px] rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-muted-foreground backdrop-blur-sm">
		<summary class="cursor-pointer text-xs font-medium text-foreground">
			ورود سریع توسعه — رمز همه: {data.devLoginPassword}
		</summary>
		<div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
			{#each data.devRoleAccounts as account (account.username)}
				<button
					type="button"
					class="rounded-xl bg-muted px-3 py-2 text-xs transition-colors duration-200 hover:bg-muted/80"
					onclick={() => quickDevLogin(account.username)}
					disabled={isLoading}
				>
					{account.label} — <span dir="ltr">{account.username}</span>
				</button>
			{/each}
		</div>
	</details>
	{/if}
</div>
