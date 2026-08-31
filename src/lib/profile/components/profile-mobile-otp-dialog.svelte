<script lang="ts">
	import { requestMobileChange, verifyMobileChange } from '$lib/profile/mobile-change';
	import { isValidIranMobile, normalizeIranMobile } from '$lib/profile/services/profile-data';
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import OTPInput from '$lib/components/ui/otp-input.svelte';
	import { cn } from '$lib/utils';

	let {
		open = $bindable(false),
		newMobile,
		targetUserId,
		onVerified
	}: {
		open?: boolean;
		newMobile: string;
		targetUserId: string;
		onVerified?: (record: Record<string, unknown>) => void;
	} = $props();

	let step = $state<1 | 2>(1);
	let otp = $state('');
	let loading = $state(false);
	let message = $state('');
	let error = $state('');
	let demoCode = $state<string | undefined>();

	const displayMobile = $derived(normalizeIranMobile(newMobile));

	$effect(() => {
		if (open) {
			step = 1;
			otp = '';
			message = '';
			error = '';
			demoCode = undefined;
		}
	});

	async function sendOtp() {
		error = '';
		message = '';
		if (!isValidIranMobile(displayMobile)) {
			error = 'شماره موبایل نامعتبر است';
			return;
		}

		loading = true;
		try {
			const res = await requestMobileChange({ newMobile: displayMobile, targetUserId });
			if (!res.ok) {
				error = res.error;
				return;
			}
			step = 2;
			demoCode = res.demoCode;
			message = res.demoCode
				? `${res.message} (کد آزمایشی: ${res.demoCode})`
				: res.message;
		} finally {
			loading = false;
		}
	}

	async function confirmOtp() {
		error = '';
		message = '';
		if (otp.length < 4) {
			error = 'کد تأیید را کامل وارد کنید';
			return;
		}

		loading = true;
		try {
			const res = await verifyMobileChange({
				newMobile: displayMobile,
				code: otp,
				targetUserId
			});
			if (!res.ok) {
				error = res.error;
				return;
			}
			onVerified?.(res.record);
			open = false;
		} finally {
			loading = false;
		}
	}
</script>

<Dialog bind:open class="max-w-sm">
	<div class="space-y-4">
		<div>
			<h2 class="text-base font-semibold">تأیید شماره موبایل جدید</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				{#if step === 1}
					برای ذخیره شماره جدید، ابتدا کد تأیید دریافت کنید.
				{:else}
					کد ارسال‌شده به
					<bdi dir="ltr" class="font-medium text-foreground">{displayMobile}</bdi>
					را وارد کنید.
				{/if}
			</p>
		</div>

		{#if step === 1}
			<div class="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-center">
				<p class="text-xs text-muted-foreground">شماره جدید</p>
				<bdi dir="ltr" class="mt-1 block text-lg font-semibold tabular-nums">{displayMobile}</bdi>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" class="flex-1 rounded-xl" onclick={() => (open = false)} disabled={loading}>
					انصراف
				</Button>
				<Button class="flex-1 rounded-xl" onclick={sendOtp} disabled={loading}>
					{loading ? 'در حال ارسال...' : 'ارسال کد'}
				</Button>
			</div>
		{:else}
			<div class="flex justify-center py-1">
				<OTPInput
					length={4}
					disabled={loading}
					error={Boolean(error)}
					class="justify-center"
					onValueChange={(value) => (otp = value)}
					onComplete={(value) => (otp = value)}
				/>
			</div>
			<div class="flex gap-2">
				<Button
					variant="outline"
					class="flex-1 rounded-xl"
					disabled={loading}
					onclick={() => {
						step = 1;
						otp = '';
						error = '';
					}}
				>
					بازگشت
				</Button>
				<Button class="flex-1 rounded-xl" onclick={confirmOtp} disabled={loading || otp.length < 4}>
					{loading ? 'در حال تأیید...' : 'تأیید و ذخیره'}
				</Button>
			</div>
		{/if}

		{#if message}
			<p class={cn('text-sm', demoCode ? 'text-primary' : 'text-muted-foreground')}>{message}</p>
		{/if}
		{#if error}
			<p class="text-sm text-destructive">{error}</p>
		{/if}
	</div>
</Dialog>
