<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { cn } from '$lib/utils';
	import { AlertCircle, CheckCircle2 } from '@lucide/svelte';

	type JalaliDatePickerComponent = typeof import('$lib/components/ui/jalali-date-picker.svelte').default;

	let {
		firstName = $bindable(''),
		lastName = $bindable(''),
		birthDate = $bindable(''),
		usernameLocal = $bindable(''),
		mobileLocal = $bindable(''),
		email = $bindable(''),
		emailVerified = false,
		emailChanged = false,
		mobileVerified = false,
		mobileChanged = false,
		needsMobileVerification = false,
		savingDetails = false,
		JalaliDatePickerCmp = null,
		onEnsureBirthDatePicker,
		onReset,
		onSubmit,
		onStartMobileVerification
	}: {
		firstName?: string;
		lastName?: string;
		birthDate?: string;
		usernameLocal?: string;
		mobileLocal?: string;
		email?: string;
		emailVerified?: boolean;
		emailChanged?: boolean;
		mobileVerified?: boolean;
		mobileChanged?: boolean;
		needsMobileVerification?: boolean;
		savingDetails?: boolean;
		JalaliDatePickerCmp?: JalaliDatePickerComponent | null;
		onEnsureBirthDatePicker: () => void;
		onReset: () => void;
		onSubmit: () => void;
		onStartMobileVerification: () => void;
	} = $props();
</script>

<div class="mb-6">
	<h1 class="text-lg font-semibold tracking-tight">مشخصات</h1>
	<p class="mt-1 text-sm text-muted-foreground">نام، تاریخ تولد، نام کاربری و اطلاعات تماس</p>
</div>

<form
	class="space-y-5"
	onsubmit={(event) => {
		event.preventDefault();
		onSubmit();
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
					onclick={() => onEnsureBirthDatePicker()}
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
			class="flex h-11 items-center overflow-hidden rounded-xl border border-border bg-background shadow-sm"
			dir="ltr"
		>
			<input
				id="email"
				type="email"
				bind:value={email}
				autocomplete="email"
				placeholder="name@example.com"
				class="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-foreground outline-none"
			/>
			<div
				class={cn(
					'flex h-full shrink-0 items-center gap-1 border-s border-border/60 px-3 text-xs font-medium',
					emailVerified ? 'text-emerald-600' : 'text-amber-600'
				)}
			>
				{#if emailVerified}
					<CheckCircle2 class="size-3.5 shrink-0" />
					<span class="whitespace-nowrap">تأیید‌شده</span>
				{:else}
					<AlertCircle class="size-3.5 shrink-0" />
					<span class="whitespace-nowrap">تأیید نشده</span>
				{/if}
			</div>
		</div>
		{#if emailChanged}
			<p class="text-xs text-amber-600">پس از ذخیره، ایمیل جدید در حساب شما ثبت می‌شود.</p>
		{/if}
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
					onclick={onStartMobileVerification}
				>
					ارسال کد تأیید
				</Button>
			</div>
		{/if}
	</div>

	<div class="flex flex-wrap gap-2 pt-2">
		<Button type="button" variant="outline" class="rounded-xl" onclick={onReset}>انصراف</Button>
		<Button type="submit" class="rounded-xl" disabled={savingDetails}>
			{savingDetails ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
		</Button>
	</div>
</form>
