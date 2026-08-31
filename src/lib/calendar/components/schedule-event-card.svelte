<script lang="ts">
	import type { ScheduleEvent } from '../types';
	import { CATEGORY_META, categoryToneClass, parseIsoDate, formatDayMonthFa } from '../utils/calendar-grid';
	import { Clock, MapPin, Users, StickyNote } from '@lucide/svelte';

	let { event }: { event: ScheduleEvent } = $props();

	const meta = $derived(CATEGORY_META[event.category]);
	const tone = $derived(categoryToneClass(meta.tone));
</script>

<article class="rounded-2xl border p-4 {tone.card}">
	<div class="mb-3 flex items-start gap-2">
		<span class="mt-1 h-8 w-1 shrink-0 rounded-full {tone.bar}"></span>
		<div class="min-w-0 flex-1">
			<h3 class="text-sm font-semibold leading-snug text-foreground">{event.title}</h3>
			<p class="mt-0.5 text-[11px] text-muted-foreground">{meta.label}</p>
		</div>
	</div>

	<ul class="space-y-2 text-xs text-muted-foreground">
		<li class="flex items-start gap-2">
			<Clock class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
			<span>
				{formatDayMonthFa(parseIsoDate(event.date))}
				<span class="mx-1 text-border">·</span>
				<span dir="ltr">{event.startTime} — {event.endTime}</span>
			</span>
		</li>
		<li class="flex items-start gap-2">
			<MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
			<span>{event.location}</span>
		</li>
		<li class="flex items-start gap-2">
			<Users class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
			<span>{event.participants}</span>
		</li>
	</ul>

	<div class="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
		<div
			class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
		>
			{event.lead.initials}
		</div>
		<div class="min-w-0">
			<p class="truncate text-xs font-medium text-foreground">
				{event.category === 'service' ? 'خدمت' : 'متخصص'}: {event.lead.name}
			</p>
			<p class="truncate text-[11px] text-muted-foreground">{event.lead.role}</p>
		</div>
	</div>

	{#if event.note}
		<p class="mt-3 flex items-start gap-2 rounded-xl bg-background/70 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
			<StickyNote class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
			<span>{event.note}</span>
		</p>
	{/if}
</article>
