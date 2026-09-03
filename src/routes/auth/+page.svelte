<script lang="ts">
	import { sanitizeAuthRedirect } from '$lib/auth-redirect';
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
	import { normalizeAuthMobile, pbErrorMessage } from '$lib/auth/auth-form-utils';
	import { OTP_CODE_LENGTH, OTP_RESEND_SECONDS, normalizeOtpCode } from '$lib/otp';
	import { cn } from '$lib/utils';
	import SeoHead from '$lib/components/seo-head.svelte';
	import AuthCredentialsForm from '$lib/auth/components/auth-credentials-form.svelte';
	import AuthMobileRequestForm from '$lib/auth/components/auth-mobile-request-form.svelte';
	import AuthOtpVerifyPanel from '$lib/auth/components/auth-otp-verify-panel.svelte';
	import AuthSlidingToggle from '$lib/auth/components/auth-sliding-toggle.svelte';
	import AuthDevLoginPanel from '$lib/auth/components/auth-dev-login-panel.svelte';

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
	let postLoginPath = $derived.by(() =>
		sanitizeAuthRedirect($page.url.searchParams.get('redirect'))
	);

	$effect(() => {
		if (!browser || !hydrated || !user) return;
		void goto(postLoginPath, { invalidateAll: true });
	});

	function validateMobile(value: string) {
		const clean = normalizeAuthMobile(value);
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
		return Math.min(100, ((resendTick - otpSentAt) / (OTP_RESEND_SECONDS * 1000)) * 100);
	});

	async function requestOtpCode(mobileValue: string) {
		const result = await requestLoginOtp(mobileValue, recoveryMode ? 'recovery' : 'login');
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
			if (!(await checkConnection())) {
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
			if (!(await checkConnection())) {
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

			if (!(await checkConnection())) {
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
			if (!(await checkConnection())) {
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
			if (!(await checkConnection())) {
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

	function switchSignInMethod(method: SignInMethod) {
		signInMethod = method;
		recoveryMode = false;
		error = '';
		if (method === 'credentials') resetOtpFlow();
	}

	const panelClass = (side: 'signIn' | 'signUp') =>
		cn(
			'flex flex-col items-center justify-center bg-card px-8 py-10 md:absolute md:top-0 md:left-0 md:h-full md:w-1/2 md:py-0',
			'transition-all duration-[600ms] ease-in-out',
			side === 'signIn' && 'md:z-[2]',
			side === 'signIn' && showSignUp && 'max-md:hidden md:translate-x-full',
			side === 'signUp' && 'md:z-[1] opacity-100 md:opacity-0',
			side === 'signUp' && showSignUp && 'md:z-[5] md:translate-x-full md:opacity-100',
			side === 'signUp' && !showSignUp && 'max-md:hidden'
		);
</script>

{#snippet otpPanel(showErr: boolean, roleActionLabel: string, showHeading = false)}
	<AuthOtpVerifyPanel
		bind:otp
		bind:otpError
		{error}
		showError={showErr}
		{showHeading}
		{roleActionLabel}
		{storedMobile}
		{otpDisplayCode}
		{detectedRole}
		{detectedName}
		{canResendOtp}
		{resendingOtp}
		{otpResendRemaining}
		{otpResendProgress}
		{isLoading}
		onClearError={() => (error = '')}
		onResend={resendOTP}
		onChangeMobile={resetOtpFlow}
		onVerify={verifyOTP}
	/>
{/snippet}

<SeoHead
	title="ورود | کلینیک هومبان"
	description="ورود به پنل مراجعان و پرسنل کلینیک روانشناسی هومبان"
	path="/auth"
	noindex={true}
/>

<div
	class="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8 safe-top safe-bottom
		bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border)/0.45)_1px,transparent_0)]
		bg-[length:28px_28px]"
	dir="rtl"
>
	<AuthSlidingToggle
		{showSignUp}
		onSignIn={openSignIn}
		onSignUp={() => openSignUp(false)}
		onClose={() => goto('/')}
	>
		<div class={panelClass('signIn')}>
			<form
				class="flex w-full max-w-sm flex-col items-center"
				onsubmit={(e) => e.preventDefault()}
			>
				<AuthCredentialsForm
					bind:signInMethod
					bind:usernameLocal
					bind:password
					{error}
					showError={!showSignUp && signInMethod === 'credentials'}
					onSubmit={submitCredentials}
					onForgotPassword={() => openSignUp(true)}
					onMethodChange={switchSignInMethod}
				>
					{#snippet mobileStep()}
						{#if otpStep === 1}
							<AuthMobileRequestForm
								bind:mobile
								{error}
								showError={!showSignUp && signInMethod === 'mobile'}
								onSubmit={sendOTP}
							/>
						{:else}
							{@render otpPanel(!showSignUp && signInMethod === 'mobile', 'ورود')}
						{/if}
					{/snippet}
				</AuthCredentialsForm>
			</form>
		</div>

		<div class={panelClass('signUp')}>
			{#if otpStep === 1}
				<form
					class="flex w-full max-w-sm flex-col items-center"
					onsubmit={(e) => e.preventDefault()}
				>
					<AuthMobileRequestForm
						bind:mobile
						{error}
						showError={showSignUp}
						title={recoveryMode ? 'بازیابی حساب' : 'ایجاد حساب'}
						subtitle={recoveryMode
							? 'کد OTP به موبایل ثبت‌شده ارسال می‌شود'
							: 'ثبت‌نام یا ورود با شماره موبایل'}
						submitLabel={recoveryMode ? 'ارسال کد' : 'ثبت‌نام'}
						onSubmit={sendOTP}
					/>
				</form>
			{:else}
				{@render otpPanel(showSignUp, recoveryMode ? 'بازیابی' : 'ورود', true)}
			{/if}
		</div>
	</AuthSlidingToggle>

	{#if data.devDemoAuth && data.devLoginPassword}
		<AuthDevLoginPanel
			password={data.devLoginPassword}
			accounts={data.devRoleAccounts}
			{isLoading}
			onQuickLogin={quickDevLogin}
		/>
	{/if}
</div>
