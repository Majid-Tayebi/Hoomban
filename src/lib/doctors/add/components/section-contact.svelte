<script lang="ts">
	import type { AddDoctorForm, AddDoctorErrors } from '../types';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';

	let {
		form = $bindable(),
		errors = {}
	}: {
		form: AddDoctorForm;
		errors?: AddDoctorErrors;
	} = $props();
</script>

<section class="space-y-4">
	<h3 class="text-sm font-semibold text-primary">اطلاعات تماس</h3>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<div class="space-y-1.5">
			<Label for="phone">شماره موبایل</Label>
			<Input
				id="phone"
				bind:value={form.phone}
				placeholder="0912xxxxxxx"
				dir="ltr"
				class={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
			/>
			{#if errors.phone}
				<p class="text-xs text-destructive">{errors.phone}</p>
			{/if}
		</div>
		<div class="space-y-1.5">
			<Label for="email">ایمیل</Label>
			<Input id="email" type="email" bind:value={form.email} dir="ltr" placeholder="name@example.com" />
		</div>
	</div>

	<div class="space-y-1.5">
		<Label for="address">آدرس</Label>
		<Input id="address" bind:value={form.address} placeholder="شهر، خیابان، ..." />
	</div>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<div class="space-y-1.5">
			<Label for="emergName">نام تماس اضطراری</Label>
			<Input id="emergName" bind:value={form.emergencyName} />
		</div>
		<div class="space-y-1.5">
			<Label for="emergPhone">شماره اضطراری</Label>
			<Input id="emergPhone" bind:value={form.emergencyPhone} dir="ltr" placeholder="09xxxxxxxxx" />
		</div>
	</div>
</section>
