<script lang="ts">
	import type { AddDoctorForm, UploadedCert } from '../types';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { FileUp, Trash2, FileText } from '@lucide/svelte';

	let { form = $bindable() }: { form: AddDoctorForm } = $props();

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function onFiles(e: Event) {
		const files = (e.currentTarget as HTMLInputElement).files;
		if (!files?.length) return;
		const next: UploadedCert[] = [...form.certificates];
		for (const file of Array.from(files)) {
			next.push({
				id: `${Date.now()}-${file.name}`,
				name: file.name,
				size: formatSize(file.size),
				file
			});
		}
		form.certificates = next;
		(e.currentTarget as HTMLInputElement).value = '';
	}

	function removeCert(id: string) {
		form.certificates = form.certificates.filter((c) => c.id !== id);
	}
</script>

<section class="space-y-4">
	<h3 class="text-sm font-semibold text-primary">مجوز و گواهینامه‌ها</h3>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<div class="space-y-1.5">
			<Label for="licenseNumber">شماره مجوز پزشکی</Label>
			<Input id="licenseNumber" bind:value={form.licenseNumber} dir="ltr" />
		</div>
		<div class="space-y-1.5">
			<Label for="licenseExpiry">تاریخ انقضای مجوز</Label>
			<Input id="licenseExpiry" type="date" bind:value={form.licenseExpiry} dir="ltr" />
		</div>
	</div>

	<div class="space-y-2">
		<Label>آپلود مدارک</Label>
		<label
			class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center transition hover:bg-muted/50"
		>
			<FileUp class="h-8 w-8 text-primary" />
			<p class="text-sm font-medium">فایل را بکشید یا انتخاب کنید</p>
			<p class="text-xs text-muted-foreground">PDF، JPG، PNG — حداکثر ۱۰ مگابایت</p>
			<input type="file" class="hidden" multiple accept=".pdf,image/*" onchange={onFiles} />
		</label>

		{#if form.certificates.length}
			<ul class="space-y-2">
				{#each form.certificates as cert (cert.id)}
					<li class="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2">
						<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<FileText class="h-4 w-4" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{cert.name}</p>
							<p class="text-[11px] text-muted-foreground">{cert.size}</p>
						</div>
						<button
							type="button"
							class="rounded-lg p-2 text-destructive hover:bg-destructive/10"
							aria-label="حذف"
							onclick={() => removeCert(cert.id)}
						>
							<Trash2 class="h-4 w-4" />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
