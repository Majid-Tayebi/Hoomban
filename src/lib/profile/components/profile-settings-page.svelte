<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser, setUserFromModel, refreshAuthUser } from '$lib/auth.svelte';
	import ProfileAddressForm from '$lib/profile/components/profile-address-form.svelte';
	import ProfileAvatarCropDialog from '$lib/profile/components/profile-avatar-crop-dialog.svelte';
	import ProfileDetailsForm from '$lib/profile/components/profile-details-form.svelte';
	import ProfileMobileOtpDialog from '$lib/profile/components/profile-mobile-otp-dialog.svelte';
	import ProfilePasswordForm from '$lib/profile/components/profile-password-form.svelte';
	import ProfileSettingsAside, {
		type ProfileTab
	} from '$lib/profile/components/profile-settings-aside.svelte';
	import {
		changePassword,
		isValidIranMobile,
		loadProfile,
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
	import { citiesForProvince } from '$lib/data/iran-provinces';

	type JalaliDatePickerComponent = typeof import('$lib/components/ui/jalali-date-picker.svelte').default;

	const roleLabels: Record<string, string> = {
		admin: 'مدیر',
		doctor: 'روانشناس',
		secretary: 'منشی',
		patient: 'مراجع',
		writer: 'نویسنده'
	};

	let user = $derived(getUser());
	let activeTab = $state<ProfileTab>('details');
	let profile = $state<ProfileRecord | null>(null);
	let loadingProfile = $state(true);
	let firstName = $state('');
	let lastName = $state('');
	let birthDate = $state('');
	let usernameLocal = $state('');
	let emailLocal = $state('');
	let registeredMobile = $state('');
	let mobileLocal = $state('');
	let province = $state('');
	let city = $state('');
	let homeAddress = $state('');
	let landline = $state('');
	let avatarPreview = $state<string | null>(null);
	let avatarFile = $state<File | null>(null);
	let avatarCropOpen = $state(false);
	let pendingAvatarFile = $state<File | null>(null);
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
	let profileUserId = $state<string | null>(null);
	let JalaliDatePickerCmp = $state<JalaliDatePickerComponent | null>(null);

	const userId = $derived(user?.id ?? null);
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
	const emailChanged = $derived(
		Boolean(profile) && emailLocal.trim().toLowerCase() !== (profile?.email || '').trim().toLowerCase()
	);
	const cityOptions = $derived(citiesForProvince(province));
	const usernameDisplay = $derived(usernameWithPrefix(usernameLocal));
	const showPushSettings = $derived(
		Boolean(user?.role && ['admin', 'secretary', 'doctor'].includes(user.role))
	);

	async function ensureBirthDatePicker() {
		if (JalaliDatePickerCmp) return;
		const [mod] = await Promise.all([
			import('$lib/components/ui/jalali-date-picker.svelte'),
			import('$lib/components/ui/calendar.svelte')
		]);
		JalaliDatePickerCmp = mod.default;
	}

	$effect(() => {
		if (activeTab === 'details') void ensureBirthDatePicker();
	});

	$effect(() => {
		if (province && city && !citiesForProvince(province).includes(city)) city = '';
	});

	function applyProfile(record: ProfileRecord) {
		profile = record;
		const parts = splitFullName(record.name);
		firstName = parts.firstName;
		lastName = parts.lastName;
		birthDate = record.birthDate;
		usernameLocal = stripUsernamePrefix(record.username);
		emailLocal = record.email;
		registeredMobile = normalizeIranMobile(record.mobile);
		mobileLocal = mobileLocalPart(record.mobile);
		province = record.province;
		city = record.city;
		homeAddress = record.homeAddress;
		landline = record.landline;
		avatarPreview = record.avatarUrl;
		avatarFile = null;
	}

	function cancelToDashboard() {
		void goto('/dashboard');
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

	async function refreshProfile(id: string) {
		loadingProfile = true;
		try {
			applyProfile(await loadProfile(id));
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
		input.value = '';
		if (!file) return;
		pendingAvatarFile = file;
		avatarCropOpen = true;
	}

	function onAvatarCropConfirm(file: File) {
		avatarFile = file;
		if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
		avatarPreview = URL.createObjectURL(file);
		pendingAvatarFile = null;
	}

	function onAvatarCropCancel() {
		pendingAvatarFile = null;
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
			email: emailLocal,
			avatarFile
		});
		applyProfile(updated);
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
		if (!emailLocal.trim()) {
			error = 'ایمیل را وارد کنید';
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLocal.trim())) {
			error = 'فرمت ایمیل نامعتبر است';
			return;
		}
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
		if (province && !city) {
			error = 'شهر را انتخاب کنید';
			return;
		}
		if (city && !province) {
			error = 'ابتدا استان را انتخاب کنید';
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
			applyProfile(updated);
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
			<ProfileSettingsAside
				{displayAvatar}
				{initial}
				{firstName}
				{lastName}
				{usernameDisplay}
				{roleLabel}
				avatarAlt={user?.name || 'پروفایل'}
				{activeTab}
				{showPushSettings}
				{onAvatarPick}
				onSelectTab={selectTab}
			/>

			<div class="p-5 sm:p-6 lg:p-8">
				{#if loadingProfile}
					<div class="flex min-h-[20rem] items-center justify-center">
						<p class="text-sm text-muted-foreground">در حال بارگذاری پروفایل...</p>
					</div>
				{:else if activeTab === 'details'}
					<ProfileDetailsForm
						bind:firstName
						bind:lastName
						bind:birthDate
						bind:usernameLocal
						bind:mobileLocal
						bind:email={emailLocal}
						emailVerified={Boolean(profile?.verified)}
						{emailChanged}
						{mobileVerified}
						{mobileChanged}
						{needsMobileVerification}
						{savingDetails}
						{JalaliDatePickerCmp}
						onEnsureBirthDatePicker={() => void ensureBirthDatePicker()}
						onReset={cancelToDashboard}
						onSubmit={submitDetails}
						onStartMobileVerification={startMobileVerification}
					/>
				{:else if activeTab === 'address'}
					<ProfileAddressForm
						bind:province
						bind:city
						bind:homeAddress
						bind:landline
						{cityOptions}
						{savingAddress}
						onReset={cancelToDashboard}
						onSubmit={submitAddress}
					/>
				{:else}
					<ProfilePasswordForm
						bind:oldPassword
						bind:newPassword
						bind:confirmPassword
						{savingPassword}
						onReset={cancelToDashboard}
						onSubmit={submitPassword}
					/>
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

<ProfileAvatarCropDialog
	bind:open={avatarCropOpen}
	file={pendingAvatarFile}
	onConfirm={onAvatarCropConfirm}
	onCancel={onAvatarCropCancel}
/>
