<script lang="ts">
	import type { DoctorEditForm } from '../types';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import MoneyInput from '$lib/components/ui/money-input.svelte';
	import Label from '$lib/components/ui/label.svelte';

	let {
		open = $bindable(false),
		form = $bindable(null as DoctorEditForm | null),
		message = '',
		onsave,
		onfile
	}: {
		open?: boolean;
		form: DoctorEditForm | null;
		message?: string;
		onsave: () => void;
		onfile: (file: File | null) => void;
	} = $props();
</script>

<Dialog bind:open>
	{#if form}
		<div class="space-y-3">
			<h2 class="text-lg font-bold">{form.id ? 'ویرایش متخصص' : 'افزودن متخصص'}</h2>
			<div class="space-y-1.5">
				<Label for="doc-name">نام نمایشی</Label>
				<Input id="doc-name" bind:value={form.displayName} />
			</div>
			<div class="space-y-1.5">
				<Label for="doc-spec">تخصص</Label>
				<Input id="doc-spec" bind:value={form.specialty} />
			</div>
			<div class="grid grid-cols-2 gap-2">
				<div class="space-y-1.5">
					<Label for="doc-fee">تعرفه (تومان)</Label>
					<MoneyInput id="doc-fee" bind:value={form.visitFee} class="rounded-xl" />
				</div>
				<div class="space-y-1.5">
					<Label for="doc-slot">مدت اسلات</Label>
					<Input id="doc-slot" type="number" bind:value={form.slotDuration} dir="ltr" />
				</div>
			</div>
			<div class="space-y-1.5">
				<Label for="doc-bio">بیو</Label>
				<textarea
					id="doc-bio"
					class="min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
					bind:value={form.bio}
				></textarea>
			</div>
			<div class="space-y-1.5">
				<Label for="doc-photo">عکس</Label>
				<input
					id="doc-photo"
					type="file"
					accept="image/*"
					class="block w-full text-sm"
					onchange={(e) => {
						const files = (e.currentTarget as HTMLInputElement).files;
						onfile(files?.[0] ?? null);
					}}
				/>
			</div>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={form.isActive} />
				فعال (آماده پذیرش)
			</label>
			{#if message}
				<p class="text-sm text-destructive">{message}</p>
			{/if}
			<div class="flex gap-2 pt-2">
				<Button variant="outline" class="flex-1 rounded-xl" onclick={() => (open = false)}>انصراف</Button>
				<Button class="flex-1 rounded-xl" onclick={onsave}>ذخیره</Button>
			</div>
		</div>
	{/if}
</Dialog>
