<script lang="ts">
	import type { PatientReferralRow } from '../types';
	import type { BookingDoctor } from '$lib/appointments/booking-types';
	import { loadBookingDoctors } from '$lib/appointments/services/booking';
	import {
		acceptPatientReferral,
		createPatientReferral,
		deletePatientReferral,
		formatReferralError,
		referralStatusLabel,
		updatePatientReferral
	} from '../services/patient-referrals';
	import SpecialistPickList from '$lib/appointments/components/specialist-pick-list.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import { ArrowRightLeft, Check, Pencil, Trash2 } from '@lucide/svelte';
	import { formatFaDateTime } from '$lib/date';

	let {
		referrals = $bindable([]),
		patientId,
		doctorId = null,
		userId = '',
		isAdmin = false,
		canCreate = false,
		onChanged
	}: {
		referrals?: PatientReferralRow[];
		patientId: string;
		doctorId?: string | null;
		userId?: string;
		isAdmin?: boolean;
		canCreate?: boolean;
		onChanged?: () => void | Promise<void>;
	} = $props();

	let dialogOpen = $state(false);
	let editingReferral = $state<PatientReferralRow | null>(null);
	let doctors = $state<BookingDoctor[]>([]);
	let doctorsLoading = $state(false);
	let selectedDoctorId = $state<string | null>(null);
	let reason = $state('');
	let clinicalSummary = $state('');
	let saving = $state(false);
	let error = $state('');

	const colleagueDoctors = $derived(
		doctorId ? doctors.filter((d) => d.id !== doctorId) : doctors
	);

	const isEditMode = $derived(editingReferral !== null);

	$effect(() => {
		if (!dialogOpen && !saving) resetForm();
	});

	function canEditReferral(referral: PatientReferralRow): boolean {
		if (isAdmin) return referral.status === 'pending';
		return !!doctorId && referral.fromDoctorId === doctorId && referral.status === 'pending';
	}

	function canDeleteReferral(referral: PatientReferralRow): boolean {
		return canEditReferral(referral);
	}

	function canAcceptReferral(referral: PatientReferralRow): boolean {
		return !!doctorId && referral.toDoctorId === doctorId && referral.status === 'pending';
	}

	async function ensureDoctorsLoaded() {
		if (doctors.length > 0) return;
		doctorsLoading = true;
		try {
			doctors = await loadBookingDoctors();
		} catch {
			doctors = [];
		} finally {
			doctorsLoading = false;
		}
	}

	function resetForm() {
		error = '';
		reason = '';
		clinicalSummary = '';
		selectedDoctorId = null;
		editingReferral = null;
	}

	async function openCreateDialog() {
		resetForm();
		dialogOpen = true;
		await ensureDoctorsLoaded();
	}

	async function openEditDialog(referral: PatientReferralRow) {
		editingReferral = referral;
		reason = referral.reason;
		clinicalSummary = referral.clinicalSummary;
		selectedDoctorId = referral.toDoctorId;
		error = '';
		dialogOpen = true;
		await ensureDoctorsLoaded();
	}

	async function submitReferral() {
		if (!doctorId || !userId || !selectedDoctorId) {
			error = 'متخصص مقصد را انتخاب کنید.';
			return;
		}
		if (!reason.trim()) {
			error = 'دلیل ارجاع را بنویسید.';
			return;
		}

		saving = true;
		error = '';
		try {
			if (editingReferral) {
				await updatePatientReferral({
					id: editingReferral.id,
					toDoctorId: selectedDoctorId,
					reason: reason.trim(),
					clinicalSummary: clinicalSummary.trim()
				});
			} else {
				await createPatientReferral({
					patientId,
					fromDoctorId: doctorId,
					toDoctorId: selectedDoctorId,
					userId,
					reason: reason.trim(),
					clinicalSummary: clinicalSummary.trim()
				});
			}
			dialogOpen = false;
			resetForm();
			await onChanged?.();
		} catch (e: unknown) {
			error = formatReferralError(e);
		} finally {
			saving = false;
		}
	}

	async function removeReferral(referral: PatientReferralRow) {
		if (!confirm('این ارجاع حذف شود؟')) return;
		try {
			await deletePatientReferral(referral.id);
			await onChanged?.();
		} catch (e: unknown) {
			alert(formatReferralError(e));
		}
	}

	async function acceptReferral(referral: PatientReferralRow) {
		try {
			await acceptPatientReferral(referral.id);
			await onChanged?.();
		} catch (e: unknown) {
			alert(formatReferralError(e));
		}
	}

	function statusBadgeClass(status: PatientReferralRow['status']): string {
		if (status === 'pending') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
		if (status === 'accepted') return 'bg-primary/15 text-primary';
		if (status === 'completed') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
		return '';
	}
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="flex-row items-start justify-between gap-2 space-y-0 px-3 pb-2 pt-3 sm:px-4">
		<div class="flex min-w-0 items-center gap-2">
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground"
			>
				<ArrowRightLeft class="h-4 w-4" />
			</div>
			<div class="min-w-0">
				<CardTitle class="text-sm font-semibold">ارجاع به همکار</CardTitle>
			</div>
		</div>
		{#if canCreate && doctorId}
			<Button
				size="sm"
				variant="outline"
				class="shrink-0 rounded-xl transition-all duration-200"
				onclick={openCreateDialog}
			>
				ارجاع به همکار
			</Button>
		{/if}
	</CardHeader>

	<CardContent class="space-y-2 px-3 pb-3 sm:px-4">
		{#if referrals.length === 0}
			<p class="rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
				هنوز ارجاعی ثبت نشده است.
			</p>
		{:else}
			<ul class="space-y-2">
				{#each referrals as referral (referral.id)}
					<li class="rounded-xl border border-border/60 bg-card px-3 py-2.5">
						<div class="flex flex-wrap items-start justify-between gap-2">
							<p class="min-w-0 flex-1 text-xs font-medium">
								{referral.fromDoctorName}
								<span class="mx-1 text-muted-foreground">←</span>
								{referral.toDoctorName}
							</p>
							<div class="flex shrink-0 flex-wrap items-center gap-1">
								<Badge variant="secondary" class="text-[10px] {statusBadgeClass(referral.status)}">
									{referralStatusLabel(referral.status)}
								</Badge>
								{#if canAcceptReferral(referral)}
									<button
										type="button"
										class="inline-flex h-7 items-center gap-1 rounded-lg bg-primary/10 px-2 text-[10px] font-medium text-primary transition-all duration-200 hover:bg-primary/20"
										title="قبول پرونده"
										onclick={() => acceptReferral(referral)}
									>
										<Check class="h-3.5 w-3.5" />
										قبول
									</button>
								{/if}
								{#if canEditReferral(referral)}
									<button
										type="button"
										class="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
										title="ویرایش ارجاع"
										onclick={() => openEditDialog(referral)}
									>
										<Pencil class="h-3.5 w-3.5" />
									</button>
								{/if}
								{#if canDeleteReferral(referral)}
									<button
										type="button"
										class="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
										title="حذف ارجاع"
										onclick={() => removeReferral(referral)}
									>
										<Trash2 class="h-3.5 w-3.5" />
									</button>
								{/if}
							</div>
						</div>
						<p class="mt-1 text-[11px] text-muted-foreground">{referral.reason}</p>
						{#if referral.clinicalSummary}
							<p class="mt-1.5 text-[11px] leading-relaxed text-foreground/90">
								{referral.clinicalSummary}
							</p>
						{/if}
						<p class="mt-1 text-[10px] tabular-nums text-muted-foreground">
							{formatFaDateTime(new Date(referral.created))}
						</p>
					</li>
				{/each}
			</ul>
		{/if}
	</CardContent>
</Card>

<Dialog bind:open={dialogOpen} class="max-w-lg">
	<div class="space-y-4">
		<div>
			<h2 class="text-lg font-bold">
				{isEditMode ? 'ویرایش ارجاع' : 'ارجاع مراجع به همکار'}
			</h2>
			<p class="mt-1 text-xs text-muted-foreground">
				{#if isEditMode}
					فقط ارجاع‌های «در انتظار» قابل ویرایش هستند.
				{:else}
					متخصص مقصد و خلاصه وضعیت درمان را مشخص کنید تا همکار بتواند پرونده را ادامه دهد.
				{/if}
			</p>
		</div>

		<div class="space-y-1.5">
			<Label>متخصص مقصد</Label>
			<SpecialistPickList
				doctors={colleagueDoctors}
				selectedId={selectedDoctorId}
				loading={doctorsLoading}
				onSelect={(doctor) => {
					selectedDoctorId = doctor.id;
				}}
			/>
		</div>

		<div class="space-y-1.5">
			<Label for="referral-reason">دلیل ارجاع</Label>
			<textarea
				id="referral-reason"
				class="min-h-[72px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
				placeholder="مثلاً نیاز به درمان تخصصی EMDR یا ارزیابی روان‌پزشکی"
				bind:value={reason}
			></textarea>
		</div>

		<div class="space-y-1.5">
			<Label for="referral-summary">خلاصه بالینی برای همکار (اختیاری)</Label>
			<textarea
				id="referral-summary"
				class="min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
				placeholder="خلاصه جلسات، تشخیص اولیه، برنامه درمان تا این لحظه..."
				bind:value={clinicalSummary}
			></textarea>
		</div>

		{#if error}
			<p class="text-sm text-destructive">{error}</p>
		{/if}

		<div class="flex gap-2 pt-1">
			<Button
				variant="outline"
				class="flex-1 rounded-xl"
				disabled={saving}
				onclick={() => {
					dialogOpen = false;
					resetForm();
				}}
			>
				انصراف
			</Button>
			<Button class="flex-1 rounded-xl" disabled={saving} onclick={submitReferral}>
				{saving ? 'در حال ذخیره...' : isEditMode ? 'ذخیره تغییرات' : 'ثبت ارجاع'}
			</Button>
		</div>
	</div>
</Dialog>
