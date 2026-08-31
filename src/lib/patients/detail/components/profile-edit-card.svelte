<script lang="ts">
	import type { PatientDetailProfile } from '../types';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';

	let {
		profile = $bindable(),
		saving = false,
		onsave
	}: {
		profile: PatientDetailProfile;
		saving?: boolean;
		onsave: () => void;
	} = $props();
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="pb-2 pt-4 px-4 sm:px-5">
		<CardTitle class="text-sm font-semibold sm:text-base">مشخصات پرونده</CardTitle>
		<CardDescription>ویرایش مشخصات مراجعه — فقط مدیر و متخصص</CardDescription>
	</CardHeader>
	<CardContent class="space-y-3 px-4 pb-4 sm:px-5">
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<div class="space-y-1.5">
				<Label for="nid">کد ملی</Label>
				<Input id="nid" bind:value={profile.nationalId} dir="ltr" />
			</div>
			<div class="space-y-1.5">
				<Label for="emerg">تماس اضطراری</Label>
				<Input id="emerg" bind:value={profile.emergencyContact} />
			</div>
		</div>
		<div class="space-y-1.5">
			<Label for="summary">خلاصه پرونده</Label>
			<textarea
				id="summary"
				class="min-h-[90px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
				bind:value={profile.summary}
			></textarea>
		</div>
		<Button class="rounded-xl" disabled={saving} onclick={onsave}>ذخیره مشخصات</Button>
	</CardContent>
</Card>
