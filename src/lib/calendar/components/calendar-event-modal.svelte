<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { getPatientRecordHref } from '$lib/rbac';
	import type { ScheduleEvent } from '../types';
	import {
		CATEGORY_META,
		categoryToneClass,
		formatDayMonthFa,
		parseIsoDate
	} from '../utils/calendar-grid';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import { Calendar, Clock, MapPin, StickyNote, Tag, User, UserRound, X } from '@lucide/svelte';

	let {
		open = $bindable(false),
		event = $bindable(null as ScheduleEvent | null)
	}: {
		open?: boolean;
		event?: ScheduleEvent | null;
	} = $props();

	const meta = $derived(event ? CATEGORY_META[event.category] : null);
	const tone = $derived(meta ? categoryToneClass(meta.tone) : null);
	const eventDate = $derived(event ? formatDayMonthFa(parseIsoDate(event.date)) : '');
	const isService = $derived(event?.category === 'service');
	const user = $derived(getUser());

	function close() {
		open = false;
	}

	function openPatientFile() {
		if (!event?.patientId || !user) return;
		close();
		goto(getPatientRecordHref(event.patientId, user.role));
	}
</script>

<Dialog bind:open class="max-w-lg">
	{#if event && meta && tone}
		<div class="space-y-4">
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0 flex-1">
					<Badge variant="outline" class="mb-2 rounded-full border px-2.5 py-0.5 text-[11px] font-medium {tone.chip}">
						{meta.label}
					</Badge>
					<h2 class="text-lg font-semibold leading-snug tracking-tight">
						{#if isService && event.serviceTitle}
							{event.participants} — {event.serviceTitle}
						{:else}
							{event.title}
						{/if}
					</h2>
					<p class="mt-1 text-sm text-muted-foreground">{eventDate}</p>
				</div>
				<button
					type="button"
					class="rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
					aria-label="بستن"
					onclick={close}
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<ul class="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
				<li class="flex items-start gap-2.5 text-muted-foreground">
					<Clock class="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
					<span>
						<span dir="ltr" class="font-medium text-foreground">{event.startTime} — {event.endTime}</span>
					</span>
				</li>
				<li class="flex items-start gap-2.5 text-muted-foreground">
					<MapPin class="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
					<span>{event.location}</span>
				</li>
				<li class="flex items-start gap-2.5 text-muted-foreground">
					<User class="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
					<span>
						<span class="block text-xs text-muted-foreground">مراجع</span>
						<span class="font-medium text-foreground">{event.participants}</span>
					</span>
				</li>
				{#if isService}
					<li class="flex items-start gap-2.5 text-muted-foreground">
						<Tag class="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
						<span>
							<span class="block text-xs text-muted-foreground">خدمت</span>
							<span class="font-medium text-foreground">{event.serviceTitle || event.lead.name}</span>
							{#if event.lead.role && event.lead.role !== 'خدمات کلینیک'}
								<span class="mt-0.5 block text-xs">{event.lead.role}</span>
							{/if}
						</span>
					</li>
				{:else}
					<li class="flex items-start gap-2.5 text-muted-foreground">
						<UserRound class="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
						<span>
							<span class="block text-xs text-muted-foreground">متخصص</span>
							<span class="font-medium text-foreground">{event.lead.name}</span>
							<span class="mt-0.5 block text-xs">{event.lead.role}</span>
						</span>
					</li>
				{/if}
				{#if event.statusLabel}
					<li class="flex items-start gap-2.5 text-muted-foreground">
						<Calendar class="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
						<span>
							<span class="block text-xs text-muted-foreground">وضعیت</span>
							<span class="font-medium text-foreground">{event.statusLabel}</span>
						</span>
					</li>
				{/if}
			</ul>

			{#if event.note}
				<div class="flex items-start gap-2 rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm text-muted-foreground">
					<StickyNote class="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
					<p class="leading-relaxed">{event.note}</p>
				</div>
			{/if}

			<div class="flex flex-wrap gap-2 pt-1">
				<Button variant="outline" class="flex-1 rounded-xl" onclick={close}>بستن</Button>
				{#if event.patientId}
					<Button class="flex-1 rounded-xl" onclick={openPatientFile}>پرونده مراجع</Button>
				{/if}
			</div>
		</div>
	{/if}
</Dialog>
