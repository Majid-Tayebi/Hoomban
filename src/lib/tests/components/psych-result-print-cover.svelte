<script lang="ts">
	import BrandLogo from '$lib/components/brand-logo.svelte';
	import {
		CLINIC_CITY,
		CLINIC_LEGAL_NAME,
		CLINIC_TAGLINE,
		CLINIC_WEBSITE
	} from '$lib/brand/clinic';
	import { HOOMBAN_BRAND_NAME } from '$lib/brand/logo';
	import { formatFaDateTime } from '$lib/date';

	let {
		testTitle,
		participantName,
		participantMobile = '',
		participantEmail = '',
		testedAt = '',
		preview = false
	}: {
		testTitle: string;
		participantName: string;
		participantMobile?: string;
		participantEmail?: string;
		testedAt?: string;
		preview?: boolean;
	} = $props();

	const testedAtLabel = $derived(
		testedAt ? formatFaDateTime(new Date(testedAt)) : formatFaDateTime(new Date())
	);
</script>

<header
	class="mb-6 break-inside-avoid border-b border-border pb-4 {preview
		? 'block'
		: 'hidden print:block'}"
>
	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0 flex-1 space-y-1.5">
			<p class="text-xs text-muted-foreground">{CLINIC_TAGLINE} · {CLINIC_CITY}</p>
			<div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
				<span class="text-sm font-semibold text-primary" dir="ltr">{CLINIC_WEBSITE}</span>
				<span class="text-primary/60" aria-hidden="true">·</span>
				<h1 class="text-lg font-bold leading-snug text-primary">{CLINIC_LEGAL_NAME}</h1>
			</div>
			<p class="text-sm font-semibold text-foreground">{testTitle}</p>
		</div>
		<BrandLogo class="h-14 w-14 shrink-0" width={112} height={112} />
	</div>

	<table class="mt-4 w-full table-fixed border-collapse text-xs" dir="rtl">
		<thead>
			<tr class="text-primary">
				<th class="w-1/4 pb-1.5 text-right align-bottom font-normal leading-tight">نام مراجع</th>
				<th class="w-1/4 pb-1.5 text-right align-bottom font-normal leading-tight">موبایل</th>
				<th class="w-1/4 pb-1.5 text-right align-bottom font-normal leading-tight">
					ایمیل / نام کاربری
				</th>
				<th class="w-1/4 pb-1.5 text-right align-bottom font-normal leading-tight">تاریخ آزمون</th>
			</tr>
		</thead>
		<tbody>
			<tr class="font-semibold text-foreground">
				<td class="pt-0 text-right align-top leading-snug">{participantName || '—'}</td>
				<td class="pt-0 text-right align-top leading-snug">
					<bdi dir="ltr" class="block text-right">{participantMobile || '—'}</bdi>
				</td>
				<td class="pt-0 text-right align-top leading-snug">
					<bdi dir="ltr" class="block break-all text-right">{participantEmail || '—'}</bdi>
				</td>
				<td class="pt-0 text-right align-top leading-snug">{testedAtLabel}</td>
			</tr>
		</tbody>
	</table>

	<p class="mt-3 text-[10px] text-muted-foreground">
		گزارش صادرشده از سامانه {HOOMBAN_BRAND_NAME} — صرفاً برای استفاده بالینی و آموزشی مراجع.
	</p>
</header>
