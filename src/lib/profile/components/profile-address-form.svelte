<script lang="ts">
	import { IRAN_PROVINCES } from '$lib/data/iran-provinces';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Select from '$lib/components/ui/select.svelte';

	let {
		province = $bindable(''),
		city = $bindable(''),
		homeAddress = $bindable(''),
		landline = $bindable(''),
		cityOptions = [],
		savingAddress = false,
		onReset,
		onSubmit
	}: {
		province?: string;
		city?: string;
		homeAddress?: string;
		landline?: string;
		cityOptions?: readonly string[];
		savingAddress?: boolean;
		onReset: () => void;
		onSubmit: () => void;
	} = $props();
</script>

<div class="mb-6">
	<h1 class="text-lg font-semibold tracking-tight">آدرس</h1>
	<p class="mt-1 text-sm text-muted-foreground">استان، شهر، آدرس منزل و تلفن ثابت</p>
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
			<Select id="city" bind:value={city} class="h-11 rounded-xl" disabled={!province}>
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
		<Button type="button" variant="outline" class="rounded-xl" onclick={onReset}>انصراف</Button>
		<Button type="submit" class="rounded-xl" disabled={savingAddress}>
			{savingAddress ? 'در حال ذخیره...' : 'ذخیره آدرس'}
		</Button>
	</div>
</form>
