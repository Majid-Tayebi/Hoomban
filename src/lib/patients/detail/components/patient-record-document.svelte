<script lang="ts">
	import type { PatientDetailData } from '../types';
	import { referralStatusLabel } from '../services/patient-referrals';
	import { attachmentCategoryLabel } from '../services/patient-attachments';
	import { HOOMBAN_BRAND_NAME, HOOMBAN_LOGO_SRC } from '$lib/brand/logo';
	import { formatFaDateTime } from '$lib/date';

	let {
		data,
		generatedAt = new Date()
	}: {
		data: PatientDetailData;
		generatedAt?: Date;
	} = $props();
</script>

<article class="mx-auto max-w-3xl space-y-6 bg-background text-foreground">
	<header class="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
		<div class="min-w-0">
			<p class="text-xs text-muted-foreground">{HOOMBAN_BRAND_NAME} · کلینیک روانشناسی</p>
			<h1 class="mt-1 text-xl font-bold">پرونده مراجع</h1>
			<p class="mt-1 text-sm font-medium">{data.name}</p>
			<p class="text-xs text-muted-foreground">
				کد مراجع: {data.patientCode}
				{#if data.contact.phone && data.contact.phone !== '—'}
					· {data.contact.phone}
				{/if}
			</p>
		</div>
		<img
			src={HOOMBAN_LOGO_SRC}
			alt=""
			class="h-14 w-14 shrink-0 object-contain"
			width="112"
			height="112"
		/>
	</header>

	<section class="space-y-2 break-inside-avoid">
		<h2 class="text-sm font-semibold">اطلاعات مراجع</h2>
		{#if data.meta.length > 0}
			<dl class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
				{#each data.meta as field (field.label)}
					<div>
						<dt class="text-muted-foreground">{field.label}</dt>
						<dd class="font-medium">{field.value}</dd>
					</div>
				{/each}
			</dl>
		{:else}
			<p class="text-xs text-muted-foreground">اطلاعات تکمیلی ثبت نشده است.</p>
		{/if}
		{#if data.profile.summary}
			<div class="rounded-xl border border-border/60 px-3 py-2.5">
				<p class="text-[11px] font-medium text-muted-foreground">خلاصه پرونده</p>
				<p class="mt-1 text-xs leading-relaxed">{data.profile.summary}</p>
			</div>
		{/if}
	</section>

	{#if data.referrals.length > 0}
		<section class="space-y-2 break-inside-avoid">
			<h2 class="text-sm font-semibold">ارجاعات</h2>
			<ul class="space-y-2">
				{#each data.referrals as referral (referral.id)}
					<li class="rounded-xl border border-border/60 px-3 py-2.5 text-xs">
						<p class="font-medium">
							{referral.fromDoctorName} → {referral.toDoctorName}
							<span class="text-muted-foreground">({referralStatusLabel(referral.status)})</span>
						</p>
						<p class="mt-1 text-muted-foreground">{referral.reason}</p>
						{#if referral.clinicalSummary}
							<p class="mt-1 leading-relaxed">{referral.clinicalSummary}</p>
						{/if}
						<p class="mt-1 text-[10px] tabular-nums text-muted-foreground">
							{formatFaDateTime(new Date(referral.created))}
						</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.appointments.length > 0}
		<section class="space-y-2 break-inside-avoid">
			<h2 class="text-sm font-semibold">نوبت‌ها</h2>
			<ul class="space-y-1.5 text-xs">
				{#each data.appointments as apt (apt.id)}
					<li class="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/40 pb-1.5">
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
		<section class="space-y-2">
			<h2 class="text-sm font-semibold">یادداشت‌های جلسه و برنامه درمان</h2>
			<ul class="space-y-3">
				{#each data.notes as note (note.id)}
					<li class="break-inside-avoid rounded-xl border border-border/60 px-3 py-3">
						<div class="flex flex-wrap items-baseline justify-between gap-2 text-xs">
							<span class="font-medium">{note.doctorName}</span>
							<span class="text-muted-foreground tabular-nums">
								{note.sessionDate
									? new Date(note.sessionDate).toLocaleDateString('fa-IR')
									: '—'}
							</span>
						</div>
						{#if note.text}
							<div class="mt-2">
								<p class="text-[11px] font-medium text-muted-foreground">یادداشت جلسه</p>
								<p class="mt-0.5 text-xs leading-relaxed whitespace-pre-wrap">{note.text}</p>
							</div>
						{/if}
						{#if note.treatmentPlan}
							<div class="mt-2">
								<p class="text-[11px] font-medium text-muted-foreground">برنامه درمان</p>
								<p class="mt-0.5 text-xs leading-relaxed whitespace-pre-wrap">
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
		<section class="break-inside-avoid">
			<h2 class="text-sm font-semibold">یادداشت‌های جلسه</h2>
			<p class="text-xs text-muted-foreground">یادداشت بالینی ثبت نشده است.</p>
		</section>
	{/if}

	{#if data.attachments.length > 0}
		<section class="space-y-2 break-inside-avoid">
			<h2 class="text-sm font-semibold">پیوست‌ها</h2>
			<ul class="space-y-1 text-xs">
				{#each data.attachments as file (file.id)}
					<li>
						{file.title}
						<span class="text-muted-foreground">
							· {attachmentCategoryLabel(file.category)} · {file.fileName}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<footer class="border-t border-border/60 pt-3 text-[10px] text-muted-foreground">
		<p>
			تهیه‌شده در {formatFaDateTime(generatedAt)} · {HOOMBAN_BRAND_NAME}
		</p>
		<p class="mt-1">این سند محرمانه است و فقط برای تداوم درمان یا ارجاع پزشکی استفاده شود.</p>
	</footer>
</article>
