<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';

	let {
		oldPassword = $bindable(''),
		newPassword = $bindable(''),
		confirmPassword = $bindable(''),
		savingPassword = false,
		onReset,
		onSubmit
	}: {
		oldPassword?: string;
		newPassword?: string;
		confirmPassword?: string;
		savingPassword?: boolean;
		onReset: () => void;
		onSubmit: () => void;
	} = $props();
</script>

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
		onSubmit();
	}}
>
	<div class="space-y-1.5">
		<Label for="oldPassword">رمز فعلی (اختیاری برای اولین بار)</Label>
		<Input id="oldPassword" type="password" bind:value={oldPassword} autocomplete="current-password" />
	</div>
	<div class="space-y-1.5">
		<Label for="newPassword">رمز جدید</Label>
		<Input id="newPassword" type="password" bind:value={newPassword} autocomplete="new-password" />
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
		<Button type="button" variant="outline" class="rounded-xl" onclick={onReset}>انصراف</Button>
		<Button type="submit" class="rounded-xl" disabled={savingPassword}>
			{savingPassword ? 'در حال ذخیره...' : 'ذخیره رمز عبور'}
		</Button>
	</div>
</form>
