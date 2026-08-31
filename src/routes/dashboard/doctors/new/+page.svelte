<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getUser } from '$lib/auth.svelte';
	import {
		createEmptyAddDoctorForm,
		validateAddDoctorForm,
		createDoctorFromForm
	} from '$lib/doctors/add';
	import type { AddDoctorErrors, AddDoctorForm } from '$lib/doctors/add/types';
	import SectionPersonal from '$lib/doctors/add/components/section-personal.svelte';
	import SectionContact from '$lib/doctors/add/components/section-contact.svelte';
	import SectionProfessional from '$lib/doctors/add/components/section-professional.svelte';
	import SectionLicenses from '$lib/doctors/add/components/section-licenses.svelte';
	import SectionSchedule from '$lib/doctors/add/components/section-schedule.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { ArrowRight } from '@lucide/svelte';

	let user = $derived(getUser());
	let form = $state<AddDoctorForm>(createEmptyAddDoctorForm());
	let errors = $state<AddDoctorErrors>({});
	let photoFile = $state<File | null>(null);
	let saving = $state(false);
	let draftSaved = $state(false);
	let message = $state('');

	function saveDraft() {
		try {
			localStorage.setItem('hoomban_doctor_draft', JSON.stringify({ ...form, photoPreview: null }));
			draftSaved = true;
			message = 'پیش‌نویس ذخیره شد';
			setTimeout(() => (draftSaved = false), 2500);
		} catch {
			message = 'ذخیره پیش‌نویس ممکن نشد';
		}
	}

	async function submit() {
		errors = validateAddDoctorForm(form);
		if (Object.keys(errors).length) {
			message = 'لطفاً خطاهای فرم را برطرف کنید';
			return;
		}

		saving = true;
		message = '';
		try {
			const result = await createDoctorFromForm(form, photoFile);
			if (!result.ok) {
				message = result.message;
				return;
			}
			localStorage.removeItem('hoomban_doctor_draft');
			goto(`/dashboard/doctors/${result.doctorId}`);
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'خطا در ثبت متخصص';
		} finally {
			saving = false;
		}
	}

	onMount(() => {
		try {
			const raw = localStorage.getItem('hoomban_doctor_draft');
			if (!raw) return;
			const parsed = JSON.parse(raw) as Partial<AddDoctorForm>;
			form = { ...createEmptyAddDoctorForm(), ...parsed, photoPreview: null };
		} catch {
			/* ignore */
		}
	});

	$effect(() => {
		if (!user) return;
		if (user.role !== 'admin' && user.role !== 'secretary') {
			goto('/dashboard/doctors');
		}
	});
</script>

<div class="space-y-4 sm:space-y-5">
	<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
		<button
			type="button"
			class="inline-flex items-center gap-1 hover:text-foreground"
			onclick={() => goto('/dashboard/doctors')}
		>
			<ArrowRight class="h-4 w-4" />
			پزشکان
		</button>
		<span>/</span>
		<span class="font-medium text-foreground">افزودن متخصص</span>
	</div>

	<header>
		<h1 class="text-xl font-bold tracking-tight sm:text-2xl">افزودن متخصص</h1>
		<p class="mt-1 text-sm text-muted-foreground">ثبت اطلاعات شخصی، حرفه‌ای و برنامه کاری</p>
	</header>

	<Card class="overflow-hidden rounded-2xl border-border/60 shadow-sm">
		<div class="bg-primary/15 px-4 py-3 sm:px-5">
			<p class="text-sm font-semibold text-primary">افزودن متخصص جدید</p>
		</div>
		<CardContent class="space-y-8 p-4 sm:p-6">
			<SectionPersonal bind:form {errors} onPhoto={(f) => (photoFile = f)} />
			<hr class="border-border/60" />
			<SectionContact bind:form {errors} />
			<hr class="border-border/60" />
			<SectionProfessional bind:form />
			<hr class="border-border/60" />
			<SectionLicenses bind:form />
			<hr class="border-border/60" />
			<SectionSchedule bind:form />

			{#if message}
				<p
					class="rounded-xl px-3 py-2 text-sm {message.includes('خطا') || message.includes('لطفاً')
						? 'bg-destructive/10 text-destructive'
						: 'bg-accent/50'}"
				>
					{message}
				</p>
			{/if}

			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button
					type="button"
					variant="outline"
					class="h-11 rounded-xl border-primary text-primary"
					onclick={saveDraft}
					disabled={saving}
				>
					{draftSaved ? 'ذخیره شد' : 'ذخیره پیش‌نویس'}
				</Button>
				<Button type="button" class="h-11 rounded-xl px-6" onclick={submit} disabled={saving}>
					{saving ? 'در حال ثبت...' : 'افزودن متخصص'}
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
