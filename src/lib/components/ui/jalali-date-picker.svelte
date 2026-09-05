<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { cn } from '$lib/utils';
	import { dateToJalali, formatJalaliBirthDate, parseIsoDate, toIsoDateString } from '$lib/date';
	import { CalendarDays } from '@lucide/svelte';
	import JalaliWheelPicker from '$lib/components/ui/jalali-wheel-picker.svelte';

	type CalendarComponent = typeof import('$lib/components/ui/calendar.svelte').default;

	let {
		id = 'birthDate',
		value = $bindable(''),
		placeholder = 'انتخاب تاریخ تولد',
		disabled = false,
		class: className = ''
	}: {
		id?: string;
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
	} = $props();

	let open = $state(false);
	let draft = $state(new Date());
	let CalendarCmp = $state<CalendarComponent | null>(null);
	let loadingCalendar = $state(false);
	let loadToken = 0;
	let isMobile = $state(false);

	const displayText = $derived(value ? formatJalaliBirthDate(value) : '');
	const todayJy = dateToJalali(new Date()).jy;

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(max-width: 767px)');
		const sync = () => {
			isMobile = mq.matches;
		};
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	$effect(() => {
		if (isMobile) return;
		void ensureCalendar();
	});

	async function ensureCalendar() {
		if (CalendarCmp) return;
		const token = ++loadToken;
		loadingCalendar = true;
		try {
			const mod = await import('$lib/components/ui/calendar.svelte');
			if (token === loadToken) CalendarCmp = mod.default;
		} finally {
			if (token === loadToken) loadingCalendar = false;
		}
	}

	async function openPicker() {
		if (disabled) return;
		draft = parseIsoDate(value) ?? new Date(1990, 0, 1, 12);
		open = true;
		if (!isMobile) void ensureCalendar();
	}

	function closePicker() {
		open = false;
	}

	function confirmSelection() {
		value = toIsoDateString(draft);
		closePicker();
	}

	function clearSelection() {
		value = '';
		closePicker();
	}

	$effect(() => {
		if (typeof document === 'undefined' || !open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});
</script>

<button
	{id}
	type="button"
	{disabled}
	class={cn(
		'flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-sm shadow-sm transition-all duration-200 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	onclick={openPicker}
>
	<span class={cn('truncate', displayText ? 'text-foreground' : 'text-muted-foreground')}>
		{displayText || placeholder}
	</span>
	<CalendarDays class="size-4 shrink-0 text-muted-foreground" />
</button>

{#if open}
	<div class="fixed inset-0 z-[100]">
		<button
			type="button"
			class="absolute inset-0 cursor-default bg-black/55"
			aria-label="بستن"
			onclick={closePicker}
		></button>

		{#if isMobile}
			<div
				class="pointer-events-auto absolute inset-x-0 bottom-0 rounded-t-2xl border border-border/60 bg-background shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-label="انتخاب تاریخ"
			>
				<div class="mx-auto mt-2 h-1 w-10 rounded-full bg-muted" aria-hidden="true"></div>
				<div class="space-y-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
					<p class="text-center text-sm font-medium">انتخاب تاریخ</p>
					<JalaliWheelPicker bind:value={draft} minYear={1300} maxYear={todayJy} />
					<div class="grid grid-cols-2 gap-2" dir="rtl">
						<Button
							type="button"
							variant="ghost"
							class="rounded-xl font-semibold text-primary"
							onclick={confirmSelection}
						>
							تأیید
						</Button>
						<Button type="button" variant="ghost" class="rounded-xl text-primary" onclick={closePicker}>
							لغو
						</Button>
					</div>
				</div>
			</div>
		{:else}
			<div class="pointer-events-none fixed inset-0 flex items-center justify-center p-4 sm:p-6">
				<div
					class="pointer-events-auto w-full max-w-sm rounded-2xl border border-border/60 bg-background p-5 shadow-2xl sm:p-6"
					role="dialog"
					aria-modal="true"
					aria-label="انتخاب تاریخ تولد"
				>
					<div class="space-y-4">
						{#if CalendarCmp}
							<CalendarCmp
								bind:value={draft}
								class="border-0 p-0 shadow-none"
								minYear={1300}
								maxYear={todayJy}
							/>
						{:else}
							<div class="flex min-h-[16rem] items-center justify-center text-sm text-muted-foreground">
								{loadingCalendar ? 'در حال بارگذاری تقویم...' : 'تقویم در دسترس نیست'}
							</div>
						{/if}

						<div class="flex flex-wrap gap-2">
							<Button type="button" variant="outline" class="flex-1 rounded-xl" onclick={clearSelection}>
								پاک کردن
							</Button>
							<Button
								type="button"
								class="flex-1 rounded-xl"
								onclick={confirmSelection}
								disabled={!CalendarCmp}
							>
								تأیید
							</Button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
