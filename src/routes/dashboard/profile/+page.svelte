<script lang="ts">
	import { getUser, setUserFromModel, refreshAuthUser } from '$lib/auth.svelte';
	import ProfileMobileOtpDialog from '$lib/profile/components/profile-mobile-otp-dialog.svelte';
	import {
		changePassword,
		isValidIranMobile,
		loadProfile,
		mapProfileRecord,
		mobileLocalPart,
		normalizeIranMobile,
		saveProfileAddress,
		saveProfileDetails,
		setInitialPassword,
		splitFullName,
		stripUsernamePrefix,
		usernameWithPrefix,
		type ProfileRecord
	} from '$lib/profile/services/profile-data';
	import { IRAN_PROVINCES, citiesForProvince } from '$lib/data/iran-provinces';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Select from '$lib/components/ui/select.svelte';
	import { cn } from '$lib/utils';
	import PushSettingsPanel from '$lib/push/components/push-settings-panel.svelte';
	import { AlertCircle, CheckCircle2, Lock, MapPin, Pencil, UserRound } from '@lucide/svelte';

	type JalaliDatePickerComponent = typeof import('$lib/components/ui/jalali-date-picker.svelte').default;

	type ProfileTab = 'details' | 'address' | 'password';

	let user = $derived(getUser());

	let activeTab = $state<ProfileTab>('details');
	let profile = $state<ProfileRecord | null>(null);
	let loadingProfile = $state(true);

	let firstName = $state('');
	let lastName = $state('');
	let birthDate = $state('');
	let usernameLocal = $state('');
	let registeredMobile = $state('');
	let mobileLocal = $state('');
	let province = $state('');
	let city = $state('');
	let homeAddress = $state('');
	let landline = $state('');
	let avatarPreview = $state<string | null>(null);
	let avatarFile = $state<File | null>(null);

	let oldPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	let savingDetails = $state(false);
	let savingAddress = $state(false);
	let savingPassword = $state(false);
	let message = $state('');
	let error = $state('');
	let otpOpen = $state(false);
	let pendingMobile = $state('');

	let fileInput: HTMLInputElement | undefined = $state();
	let profileUserId = $state<string | null>(null);
	let JalaliDatePickerCmp = $state<JalaliDatePickerComponent | null>(null);

	async function ensureBirthDatePicker() {
		if (JalaliDatePickerCmp) return;
		const [mod] = await Promise.all([
			import('$lib/components/ui/jalali-date-picker.svelte'),
			import('$lib/components/ui/calendar.svelte')
		]);
		JalaliDatePickerCmp = mod.default;
	}

	const userId = $derived(user?.id ?? null);

	$effect(() => {
		if (activeTab === 'details') void ensureBirthDatePicker();
	});

	const roleLabels: Record<string, string> = {
		admin: 'مدیر',
		doctor: 'روانشناس',
		secretary: 'منشی',
		patient: 'مراجع',
		writer: 'نویسنده'
	};

	const roleLabel = $derived(roleLabels[user?.role ?? ''] ?? 'کاربر');
	const displayAvatar = $derived(avatarPreview || profile?.avatarUrl);
	const initial = $derived((firstName || user?.name || 'ه').trim().charAt(0) || 'ه');
	const currentMobile = $derived(normalizeIranMobile(`98${mobileLocal}`));
	const mobileChanged = $derived(
		Boolean(registeredMobile && currentMobile && currentMobile !== registeredMobile)
	);
	const mobileVerified = $derived(
		isValidIranMobile(currentMobile) &&
			!mobileChanged &&
			Boolean(registeredMobile) &&
			Boolean(profile?.verified)
	);
	const needsMobileVerification = $derived(
		isValidIranMobile(currentMobile) &&
			!mobileChanged &&
			Boolean(registeredMobile) &&
			!profile?.verified
	);
	const cityOptions = $derived(citiesForProvince(province));
	const usernameDisplay = $derived(usernameWithPrefix(usernameLocal));

	$effect(() => {
		if (province && city && !citiesForProvince(province).includes(city)) {
			city = '';
		}
	});

	function applyProfile(record: ProfileRecord) {
		profile = record;
		const parts = splitFullName(record.name);
		firstName = parts.firstName;
		lastName = parts.lastName;
		birthDate = record.birthDate;
		usernameLocal = stripUsernamePrefix(record.username);
		registeredMobile = normalizeIranMobile(record.mobile);
		mobileLocal = mobileLocalPart(record.mobile);
		province = record.province;
		city = record.city;
		homeAddress = record.homeAddress;
		landline = record.landline;
		avatarPreview = record.avatarUrl;
		avatarFile = null;
	}

	function resetDetailsForm() {
		if (profile) applyProfile(profile);
		message = '';
		error = '';
	}

	function resetAddressForm() {
		if (profile) {
			province = profile.province;
			city = profile.city;
			homeAddress = profile.homeAddress;
			landline = profile.landline;
		}
		message = '';
		error = '';
	}

	function resetPasswordForm() {
		oldPassword = '';
		newPassword = '';
		confirmPassword = '';
		message = '';
		error = '';
	}

	async function refreshProfile(userId: string) {
		loadingProfile = true;
		try {
			const record = await loadProfile(userId);
			applyProfile(record);
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'بارگذاری پروفایل ناموفق بود';
		} finally {
			loadingProfile = false;
		}
	}

	$effect(() => {
		if (!userId || userId === 'demo-user') {
			loadingProfile = false;
			profileUserId = null;
			return;
		}
		if (profileUserId === userId) return;
		profileUserId = userId;
		void refreshProfile(userId);
	});

	function onAvatarPick(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		avatarFile = file;
		avatarPreview = URL.createObjectURL(file);
	}

	async function persistDetails() {
		if (!userId || userId === 'demo-user') {
			error = 'برای ذخیره پروفایل باید با حساب واقعی وارد شوید';
			return;
		}

		const updated = await saveProfileDetails(userId, {
			firstName,
			lastName,
			birthDate,
			username: usernameLocal,
			avatarFile
		});

		const mapped = mapProfileRecord(updated);
		applyProfile(mapped);
		await refreshAuthUser();
		message = 'مشخصات ذخیره شد';
	}

	function startMobileVerification() {
		pendingMobile = currentMobile;
		otpOpen = true;
	}

	async function submitDetails() {
		message = '';
		error = '';

		if (!isValidIranMobile(currentMobile)) {
			error = 'شماره موبایل باید ۱۰ رقم بعد از ۹ باشد (مثال: 912xxxxxxx)';
			return;
		}

		if (mobileChanged) {
			pendingMobile = currentMobile;
			otpOpen = true;
			return;
		}

		savingDetails = true;
		try {
			await persistDetails();
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'ذخیره ناموفق بود';
		} finally {
			savingDetails = false;
		}
	}

	async function submitAddress() {
		message = '';
		error = '';
		if (!userId || userId === 'demo-user') {
			error = 'برای ذخیره پروفایل باید با حساب واقعی وارد شوید';
			return;
		}

		savingAddress = true;
		try {
			const updated = await saveProfileAddress(userId, {
				province,
				city,
				homeAddress,
				landline
			});
			applyProfile(mapProfileRecord(updated));
			message = 'آدرس ذخیره شد';
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'ذخیره ناموفق بود';
		} finally {
			savingAddress = false;
		}
	}

	async function onMobileVerified(record: Record<string, unknown>) {
		registeredMobile = normalizeIranMobile(String(record.mobile || pendingMobile));
		mobileLocal = mobileLocalPart(registeredMobile);

		if (user) {
			setUserFromModel({
				...user,
				mobile: registeredMobile,
				email: String(record.email || user.email || '')
			});
		}

		if (profile) {
			profile = {
				...profile,
				mobile: registeredMobile,
				email: String(record.email || profile.email),
				verified: true
			};
		}

		savingDetails = true;
		try {
			await persistDetails();
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'ذخیره ناموفق بود';
		} finally {
			savingDetails = false;
		}
	}

	async function submitPassword() {
		message = '';
		error = '';
		if (!user?.id || user.id === 'demo-user') {
			error = 'برای تغییر رمز باید با حساب واقعی وارد شوید';
			return;
		}

		savingPassword = true;
		try {
			if (oldPassword.trim()) {
				await changePassword(user.id, {
					oldPassword,
					password: newPassword,
					passwordConfirm: confirmPassword
				});
			} else {
				await setInitialPassword(user.id, {
					password: newPassword,
					passwordConfirm: confirmPassword
				});
			}
			resetPasswordForm();
			message = 'رمز عبور با موفقیت ذخیره شد';
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'تغییر رمز ناموفق بود';
		} finally {
			savingPassword = false;
		}
	}

	function selectTab(tab: ProfileTab) {
		activeTab = tab;
		message = '';
		error = '';
	}
</script>

<div class="mx-auto w-full max-w-5xl">
	<div class="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
		<div class="grid min-h-[32rem] lg:grid-cols-[15.5rem_1fr]">
			<aside class="border-b border-border/50 bg-muted/20 p-5 lg:border-b-0 lg:border-e">
				<div class="flex flex-col items-center text-center">
					<div class="relative">
						<Avatar class="size-24 shadow-md ring-4 ring-background">
							{#if displayAvatar}
								<img src={displayAvatar} alt={user?.name || 'پروفایل'} class="h-full w-full object-cover" />
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-primary text-2xl font-bold text-primary-foreground"
								>
									{initial}
								</div>
							{/if}
						</Avatar>
						<button
							type="button"
							class="absolute -bottom-1 -start-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform duration-200 hover:scale-105"
							aria-label="تغییر عکس پروفایل"
							onclick={() => fileInput?.click()}
						>
							<Pencil class="size-3.5" />
						</button>
						<input
							bind:this={fileInput}
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							class="hidden"
							onchange={onAvatarPick}
						/>
					</div>

					<p class="mt-4 text-base font-semibold">{firstName} {lastName}</p>
					<p class="mt-0.5 font-mono text-xs text-muted-foreground" dir="ltr">{usernameDisplay}</p>
					<p class="mt-0.5 text-sm text-muted-foreground">{roleLabel}</p>
				</div>

				<nav class="mt-6 space-y-1">
					<button
						type="button"
						class={cn(
							'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
							activeTab === 'details'
								? 'bg-primary/10 text-primary'
								: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
						)}
						onclick={() => selectTab('details')}
					>
						<UserRound class="size-4 shrink-0" />
						<span>مشخصات</span>
					</button>
					<button
						type="button"
						class={cn(
							'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
							activeTab === 'address'
								? 'bg-primary/10 text-primary'
								: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
						)}
						onclick={() => selectTab('address')}
					>
						<MapPin class="size-4 shrink-0" />
						<span>آدرس</span>
					</button>
					<button
						type="button"
						class={cn(
							'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
							activeTab === 'password'
								? 'bg-primary/10 text-primary'
								: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
						)}
						onclick={() => selectTab('password')}
					>
						<Lock class="size-4 shrink-0" />
						<span>رمز عبور</span>
					</button>
				</nav>

				{#if user && user.role && ['admin', 'secretary', 'doctor'].includes(user.role)}
					<div class="mt-6">
						<PushSettingsPanel />
					</div>
				{/if}
			</aside>

			<div class="p-5 sm:p-6 lg:p-8">
				{#if loadingProfile}
					<div class="flex min-h-[20rem] items-center justify-center">
						<p class="text-sm text-muted-foreground">در حال بارگذاری پروفایل...</p>
					</div>
				{:else if activeTab === 'details'}
					<div class="mb-6">
						<h1 class="text-lg font-semibold tracking-tight">مشخصات</h1>
						<p class="mt-1 text-sm text-muted-foreground">
							نام، تاریخ تولد، نام کاربری و اطلاعات تماس
						</p>
					</div>

					<form
						class="space-y-5"
						onsubmit={(event) => {
							event.preventDefault();
							submitDetails();
						}}
					>
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-1.5">
								<Label for="firstName">نام</Label>
								<Input id="firstName" bind:value={firstName} placeholder="نام" />
							</div>
							<div class="space-y-1.5">
								<Label for="lastName">نام خانوادگی</Label>
								<Input id="lastName" bind:value={lastName} placeholder="نام خانوادگی" />
							</div>
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-1.5">
								<Label for="birthDate">تاریخ تولد</Label>
								{#if JalaliDatePickerCmp}
									<JalaliDatePickerCmp id="birthDate" bind:value={birthDate} />
								{:else}
									<button
										id="birthDate"
										type="button"
										class="flex h-11 w-full items-center rounded-xl border border-border bg-muted/30 px-3 text-sm text-muted-foreground"
										onclick={() => void ensureBirthDatePicker()}
									>
										در حال آماده‌سازی تقویم...
									</button>
								{/if}
							</div>
							<div class="space-y-1.5">
								<Label for="username">نام کاربری</Label>
								<div
									class="flex h-11 items-center overflow-hidden rounded-xl border border-border bg-background shadow-sm"
									dir="ltr"
								>
									<div
										class="flex h-full shrink-0 items-center border-e border-border/60 bg-muted/50 px-3 text-sm font-medium text-muted-foreground"
									>
										@
									</div>
									<input
										id="username"
										bind:value={usernameLocal}
										placeholder="username"
										autocomplete="username"
										class="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-foreground outline-none"
									/>
								</div>
								<p class="text-xs text-muted-foreground">۳ تا ۳۰ کاراکتر — حروف انگلیسی، عدد و _</p>
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="email">ایمیل</Label>
							<div
								class="flex h-11 items-center overflow-hidden rounded-xl border border-border bg-background opacity-90 shadow-sm"
								dir="ltr"
							>
								<input
									id="email"
									value={profile?.email || ''}
									disabled
									class="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-foreground outline-none disabled:cursor-not-allowed"
								/>
								<div
									class={cn(
										'flex h-full shrink-0 items-center gap-1 border-s border-border/60 px-3 text-xs font-medium',
										profile?.verified ? 'text-emerald-600' : 'text-amber-600'
									)}
								>
									{#if profile?.verified}
										<CheckCircle2 class="size-3.5 shrink-0" />
										<span class="whitespace-nowrap">تأیید‌شده</span>
									{:else}
										<AlertCircle class="size-3.5 shrink-0" />
										<span class="whitespace-nowrap">تأیید نشده</span>
									{/if}
								</div>
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="mobile">شماره موبایل</Label>
							<div
								class="flex h-11 items-center overflow-hidden rounded-xl border border-border bg-background shadow-sm"
								dir="ltr"
							>
								<div
									class="flex h-full shrink-0 items-center border-e border-border/60 bg-muted/50 px-3 text-sm font-medium tabular-nums text-muted-foreground"
								>
									+98
								</div>
								<input
									id="mobile"
									bind:value={mobileLocal}
									inputmode="numeric"
									placeholder="912xxxxxxx"
									class="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-foreground outline-none"
								/>
								<div
									class={cn(
										'flex h-full shrink-0 items-center gap-1 border-s border-border/60 px-3 text-xs font-medium',
										mobileVerified ? 'text-emerald-600' : 'text-amber-600'
									)}
								>
									{#if mobileVerified}
										<CheckCircle2 class="size-3.5 shrink-0" />
										<span class="whitespace-nowrap">تأیید‌شده</span>
									{:else}
										<AlertCircle class="size-3.5 shrink-0" />
										<span class="whitespace-nowrap">تأیید نشده</span>
									{/if}
								</div>
							</div>
							{#if mobileChanged}
								<p class="text-xs text-amber-600">
									برای تأیید شماره جدید، «ذخیره تغییرات» را بزنید تا کد OTP ارسال شود.
								</p>
							{:else if needsMobileVerification}
								<div class="flex flex-wrap items-center gap-2">
									<p class="text-xs text-amber-600">
										شماره موبایل هنوز تأیید نشده — برای فعال‌سازی کامل، کد OTP بگیرید.
									</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										class="h-8 rounded-lg text-xs"
										onclick={startMobileVerification}
									>
										ارسال کد تأیید
									</Button>
								</div>
							{/if}
						</div>

						<div class="flex flex-wrap gap-2 pt-2">
							<Button type="button" variant="outline" class="rounded-xl" onclick={resetDetailsForm}>
								انصراف
							</Button>
							<Button type="submit" class="rounded-xl" disabled={savingDetails}>
								{savingDetails ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
							</Button>
						</div>
					</form>
				{:else if activeTab === 'address'}
					<div class="mb-6">
						<h1 class="text-lg font-semibold tracking-tight">آدرس</h1>
						<p class="mt-1 text-sm text-muted-foreground">استان، شهر، آدرس منزل و تلفن ثابت</p>
					</div>

					<form
						class="space-y-5"
						onsubmit={(event) => {
							event.preventDefault();
							submitAddress();
						}}
					>
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-1.5">
								<Label for="province">استان</Label>
								<Select id="province" bind:value={province} class="h-11 rounded-xl">
									<option value="">انتخاب استان</option>
									{#each IRAN_PROVINCES as p (p)}
										<option value={p}>{p}</option>
									{/each}
								</Select>
							</div>
							<div class="space-y-1.5">
								<Label for="city">شهر</Label>
								<Select
									id="city"
									bind:value={city}
									class="h-11 rounded-xl"
									disabled={!province}
								>
									<option value="">{province ? 'انتخاب شهر' : 'ابتدا استان را انتخاب کنید'}</option>
									{#each cityOptions as c (c)}
										<option value={c}>{c}</option>
									{/each}
								</Select>
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="homeAddress">آدرس منزل</Label>
							<Input id="homeAddress" bind:value={homeAddress} placeholder="خیابان، پلاک، واحد" />
						</div>

						<div class="space-y-1.5">
							<Label for="landline">تلفن ثابت</Label>
							<Input
								id="landline"
								bind:value={landline}
								inputmode="tel"
								placeholder="021xxxxxxxx"
								dir="ltr"
								class="text-left"
							/>
						</div>

						<div class="flex flex-wrap gap-2 pt-2">
							<Button type="button" variant="outline" class="rounded-xl" onclick={resetAddressForm}>
								انصراف
							</Button>
							<Button type="submit" class="rounded-xl" disabled={savingAddress}>
								{savingAddress ? 'در حال ذخیره...' : 'ذخیره آدرس'}
							</Button>
						</div>
					</form>
				{:else}
					<div class="mb-6">
						<h1 class="text-lg font-semibold tracking-tight">رمز عبور</h1>
						<p class="mt-1 text-sm text-muted-foreground">
							برای ورود با نام کاربری، رمز تعیین کنید. اگر قبلاً رمز گذاشته‌اید، رمز فعلی را هم وارد کنید.
						</p>
					</div>

					<form
						class="max-w-md space-y-4"
						onsubmit={(event) => {
							event.preventDefault();
							submitPassword();
						}}
					>
						<div class="space-y-1.5">
							<Label for="oldPassword">رمز فعلی (اختیاری برای اولین بار)</Label>
							<Input
								id="oldPassword"
								type="password"
								bind:value={oldPassword}
								autocomplete="current-password"
							/>
						</div>
						<div class="space-y-1.5">
							<Label for="newPassword">رمز جدید</Label>
							<Input
								id="newPassword"
								type="password"
								bind:value={newPassword}
								autocomplete="new-password"
							/>
						</div>
						<div class="space-y-1.5">
							<Label for="confirmPassword">تکرار رمز</Label>
							<Input
								id="confirmPassword"
								type="password"
								bind:value={confirmPassword}
								autocomplete="new-password"
							/>
						</div>

						<div class="flex flex-wrap gap-2 pt-2">
							<Button type="button" variant="outline" class="rounded-xl" onclick={resetPasswordForm}>
								انصراف
							</Button>
							<Button type="submit" class="rounded-xl" disabled={savingPassword}>
								{savingPassword ? 'در حال ذخیره...' : 'ذخیره رمز عبور'}
							</Button>
						</div>
					</form>
				{/if}

				{#if message}
					<p class="mt-4 text-sm text-primary">{message}</p>
				{/if}
				{#if error}
					<p class="mt-4 text-sm text-destructive">{error}</p>
				{/if}
			</div>
		</div>
	</div>
</div>

{#if user?.id}
	<ProfileMobileOtpDialog
		bind:open={otpOpen}
		newMobile={pendingMobile}
		targetUserId={user.id}
		onVerified={onMobileVerified}
	/>
{/if}
