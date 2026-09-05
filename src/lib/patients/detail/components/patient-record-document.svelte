<script lang="ts">
	import type { PatientDetailData } from '../types';
	import { referralStatusLabel } from '../services/patient-referrals';
	import { attachmentCategoryLabel } from '../services/patient-attachments';
	import BrandLogo from '$lib/components/brand-logo.svelte';
	import { getSiteBrand } from '$lib/brand/site-brand.svelte';
	import { formatFaDateTime } from '$lib/date';

	let {
		data,
		generatedAt = new Date()
	}: {
		data: PatientDetailData;
		generatedAt?: Date;
	} = $props();

	const brand = $derived(getSiteBrand());
</script>

<article class="mx-auto max-w-4xl space-y-4 bg-background text-foreground print:max-w-none">
	<header
		class="flex items-start justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 sm:px-5"
	>
		<div class="min-w-0 flex-1">
			<p class="text-[10px] font-medium text-muted-foreground">
				{brand.brandName}
				{#if brand.tagline}
					<span class="font-normal"> · {brand.tagline}</span>
				{/if}
			</p>
			<h1 class="mt-1 text-lg font-bold tracking-tight sm:text-xl">پرونده مراجع</h1>
			<p class="mt-1.5 text-base font-semibold text-foreground sm:text-lg">{data.name}</p>
			<div class="mt-2 flex flex-wrap items-center gap-1.5">
				<span
					class="inline-flex items-center rounded-md border border-border/70 bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums"
				>
					کد مراجع: {data.patientCode}
				</span>
				{#if data.contact.phone && data.contact.phone !== '—'}
					<span
						class="inline-flex items-center rounded-md border border-border/70 bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums"
						dir="ltr"
					>
						{data.contact.phone}
					</span>
				{/if}
			</div>
		</div>
		<div class="shrink-0 rounded-lg border border-border/40 bg-background/60 p-1.5">
			<BrandLogo class="h-14 w-14" width={112} height={112} />
		</div>
	</header>

	<section class="break-inside-avoid rounded-xl border border-border/60 bg-card/50 px-4 py-3.5 sm:px-5">
		<p class="text-[10px] font-medium text-muted-foreground">شناسه</p>
		<h2 class="mt-0.5 text-sm font-bold">اطلاعات مراجع</h2>
		{#if data.meta.length > 0}
			<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
				{#each data.meta as field (field.label)}
					<div class="min-w-0">
						<dt class="text-[10px] leading-tight text-muted-foreground">{field.label}</dt>
						<dd class="mt-0.5 text-xs font-medium leading-snug break-words">{field.value}</dd>
					</div>
				{/each}
			</dl>
		{:else}
			<p
				class="mt-3 rounded-lg border border-dashed border-border/50 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground"
			>
				اطلاعات تکمیلی ثبت نشده است.
			</p>
		{/if}
		{#if data.profile.summary}
			<div class="mt-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
				<p class="text-[10px] font-medium text-muted-foreground">خلاصه پرونده</p>
				<p class="mt-1 text-xs leading-relaxed">{data.profile.summary}</p>
			</div>
		{/if}
	</section>

	{#if data.referrals.length > 0}
		<section class="break-inside-avoid rounded-xl border border-border/60 bg-card/50 px-4 py-3.5 sm:px-5">
			<p class="text-[10px] font-medium text-muted-foreground">ارجاع</p>
			<h2 class="mt-0.5 text-sm font-bold">ارجاعات</h2>
			<ul class="mt-3 space-y-2">
				{#each data.referrals as referral (referral.id)}
					<li class="rounded-lg border border-border/50 bg-background/60 px-3 py-2.5 text-xs">
						<p class="font-medium">
							{referral.fromDoctorName} → {referral.toDoctorName}
							<span
								class="ms-1 inline-flex rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground"
							>
								{referralStatusLabel(referral.status)}
							</span>
						</p>
						<p class="mt-1 text-muted-foreground">{referral.reason}</p>
						{#if referral.clinicalSummary}
							<p class="mt-1.5 leading-relaxed">{referral.clinicalSummary}</p>
						{/if}
						<p class="mt-1.5 text-[10px] tabular-nums text-muted-foreground">
							{formatFaDateTime(new Date(referral.created))}
						</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.appointments.length > 0}
		<section class="break-inside-avoid rounded-xl border border-border/60 bg-card/50 px-4 py-3.5 sm:px-5">
			<p class="text-[10px] font-medium text-muted-foreground">زمان‌بندی</p>
			<h2 class="mt-0.5 text-sm font-bold">نوبت‌ها</h2>
			<ul class="mt-3 divide-y divide-border/40 text-xs">
				{#each data.appointments as apt (apt.id)}
					<li class="flex flex-wrap items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0">
						<span class="font-medium">{apt.displayName}</span>
						<span class="text-muted-foreground tabular-nums">
							{formatFaDateTime(apt.dateTime)} · {apt.status}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.notes.length > 0}
		<section class="rounded-xl border border-border/60 bg-card/50 px-4 py-3.5 sm:px-5">
			<p class="text-[10px] font-medium text-muted-foreground">بالینی</p>
			<h2 class="mt-0.5 text-sm font-bold">یادداشت‌های جلسه و برنامه درمان</h2>
			<ul class="mt-3 space-y-3">
				{#each data.notes as note (note.id)}
					<li class="break-inside-avoid rounded-lg border border-border/50 bg-background/70 px-3 py-3">
						<div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/40 pb-2 text-xs">
							<span class="font-semibold">{note.doctorName}</span>
							<span class="text-muted-foreground tabular-nums">
								{note.sessionDate
									? new Date(note.sessionDate).toLocaleDateString('fa-IR')
									: '—'}
							</span>
						</div>
						{#if note.text}
							<div class="mt-2.5 rounded-md border border-border/40 bg-muted/15 px-2.5 py-2">
								<p class="text-[10px] font-medium text-muted-foreground">یادداشت جلسه</p>
								<p class="mt-1 text-xs leading-relaxed whitespace-pre-wrap">{note.text}</p>
							</div>
						{/if}
						{#if note.treatmentPlan}
							<div class="mt-2 rounded-md border border-primary/15 bg-primary/[0.03] px-2.5 py-2">
								<p class="text-[10px] font-medium text-muted-foreground">برنامه درمان</p>
								<p class="mt-1 text-xs leading-relaxed whitespace-pre-wrap">
									{note.treatmentPlan}
								</p>
							</div>
						{/if}
						{#if note.audio.length > 0}
							<p class="mt-2 text-[10px] text-muted-foreground">
								{note.audio.length.toLocaleString('fa-IR')} فایل صوتی ضمیمه پرونده الکترونیک
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{:else}
		<section class="break-inside-avoid rounded-xl border border-border/60 bg-card/50 px-4 py-3.5 sm:px-5">
			<p class="text-[10px] font-medium text-muted-foreground">بالینی</p>
			<h2 class="mt-0.5 text-sm font-bold">یادداشت‌های جلسه</h2>
			<div
				class="mt-3 rounded-lg border border-dashed border-border/50 bg-muted/30 px-4 py-5 text-center"
			>
				<p class="text-xs text-muted-foreground">یادداشت بالینی ثبت نشده است.</p>
			</div>
		</section>
	{/if}

	{#if data.attachments.length > 0}
		<section class="break-inside-avoid rounded-xl border border-border/60 bg-card/50 px-4 py-3.5 sm:px-5">
			<p class="text-[10px] font-medium text-muted-foreground">فایل‌ها</p>
			<h2 class="mt-0.5 text-sm font-bold">پیوست‌ها</h2>
			<ul class="mt-3 space-y-1.5 text-xs">
				{#each data.attachments as file (file.id)}
					<li class="flex flex-wrap items-baseline gap-x-1.5 rounded-md px-1 py-0.5">
						<span class="font-medium">{file.title}</span>
						<span class="text-muted-foreground">
							· {attachmentCategoryLabel(file.category)} · {file.fileName}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<footer
		class="rounded-lg border border-border/40 bg-muted/40 px-4 py-3 text-[10px] leading-relaxed text-muted-foreground"
	>
		<p>
			تهیه‌شده در {formatFaDateTime(generatedAt)} · {brand.brandName}
		</p>
		<p class="mt-1 font-medium">
			این سند محرمانه است و فقط برای تداوم درمان یا ارجاع پزشکی استفاده شود.
		</p>
	</footer>
</article>
