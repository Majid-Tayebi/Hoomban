<script lang="ts">
	import type { AddDoctorForm, AddDoctorErrors } from '../types';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { Camera } from '@lucide/svelte';

	let {
		form = $bindable(),
		errors = {},
		onPhoto
	}: {
		form: AddDoctorForm;
		errors?: AddDoctorErrors;
		onPhoto: (file: File | null) => void;
	} = $props();

	function onFileChange(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
		onPhoto(file);
		if (file) {
			form.photoPreview = URL.createObjectURL(file);
		}
	}
</script>

<section class="space-y-4">
	<h3 class="text-sm font-semibold text-primary">اطلاعات شخصی</h3>

	<div class="flex flex-col gap-4 sm:flex-row sm:items-start">
		<div class="relative mx-auto w-36 shrink-0 sm:mx-0">
			{#if form.photoPreview}
				<img
					src={form.photoPreview}
					alt="پیش‌نمایش"
					class="aspect-square w-full rounded-2xl object-cover"
				/>
			{:else}
				<div
					class="flex aspect-square w-full items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground"
				>
					عکس پروفایل
				</div>
			{/if}
			<label
				class="absolute -bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
			>
				<Camera class="h-4 w-4" />
				<input type="file" accept="image/*" class="hidden" onchange={onFileChange} />
			</label>
		</div>

		<div class="min-w-0 flex-1 space-y-3">
			<div class="space-y-1.5">
				<Label for="fullName">نام کامل</Label>
				<Input
					id="fullName"
					bind:value={form.fullName}
					placeholder="مثال: دکتر سارا احمدی"
					class={errors.fullName ? 'border-destructive' : ''}
				/>
				{#if errors.fullName}
					<p class="text-xs text-destructive">{errors.fullName}</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<Label>جنسیت</Label>
				<div class="flex flex-wrap gap-4 text-sm">
					{#each [{ v: 'female', l: 'زن' }, { v: 'male', l: 'مرد' }, { v: 'other', l: 'سایر' }] as g}
						<label class="inline-flex items-center gap-2">
							<input type="radio" name="gender" value={g.v} bind:group={form.gender} />
							{g.l}
						</label>
					{/each}
				</div>
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="space-y-1.5">
					<Label for="birthDate">تاریخ تولد</Label>
					<Input id="birthDate" type="date" bind:value={form.birthDate} dir="ltr" />
				</div>
				<div class="space-y-1.5">
					<Label for="doctorCode">کد پزشک</Label>
					<Input id="doctorCode" bind:value={form.doctorCode} dir="ltr" disabled class="opacity-70" />
				</div>
			</div>
		</div>
	</div>

	<div class="space-y-1.5">
		<Label for="about">درباره</Label>
		<textarea
			id="about"
			class="min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
			bind:value={form.about}
			placeholder="بیوگرافی کوتاه حرفه‌ای..."
		></textarea>
	</div>
</section>
