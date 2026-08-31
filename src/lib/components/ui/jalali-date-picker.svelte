<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { cn } from '$lib/utils';
	import { formatJalaliBirthDate, parseIsoDate, toIsoDateString } from '$lib/date';
	import { CalendarDays } from '@lucide/svelte';

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

	const displayText = $derived(value ? formatJalaliBirthDate(value) : '');

	$effect(() => {
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
		draft = parseIsoDate(value) ?? new Date();
		open = true;
		void ensureCalendar();
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

		<div class="pointer-events-none fixed inset-0 flex items-center justify-center p-4 sm:p-6">
			<div
				class="pointer-events-auto w-full max-w-sm rounded-2xl border border-border/60 bg-background p-5 shadow-2xl sm:p-6"
				role="dialog"
				aria-modal="true"
				aria-label="انتخاب تاریخ تولد"
			>
				<div class="space-y-4">
					{#if CalendarCmp}
						<CalendarCmp bind:value={draft} class="border-0 p-0 shadow-none" minYear={1300} />
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
	</div>
{/if}
