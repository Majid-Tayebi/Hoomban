<script lang="ts">
	import { pb } from '$lib/pocketbase';
	import { getUser } from '$lib/auth.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import MoneyInput from '$lib/components/ui/money-input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import CalendarScheduleEditor from '$lib/schedule/components/calendar-schedule-editor.svelte';
	import { startOfDay } from '$lib/date';
	import {
		expandWeeklyToDates,
		markedDatesFromMap,
		parseScheduleDates,
		type DateScheduleMap
	} from '$lib/schedule/date-schedule';
	import { Clock, Wallet, FileText } from '@lucide/svelte';

	let user = $derived(getUser());

	let scheduleDates = $state<DateScheduleMap>({});
	let selectedDate = $state(startOfDay(new Date()));
	let slotDuration = $state(45);
	let visitFee = $state(0);
	let bio = $state('');
	let isLoading = $state(false);
	let message = $state('');
	let bioOpen = $state(false);

	async function saveSchedule() {
		if (!user) return;
		isLoading = true;
		message = '';

		try {
			const doctorRecords = await pb.collection('doctors').getList(1, 1, {
				filter: `user = "${user.id}"`
			});

			const payload = {
				schedule_dates: scheduleDates,
				slot_duration: slotDuration,
				visit_fee: visitFee,
				bio: bio
			};

			if (doctorRecords.items.length > 0) {
				await pb.collection('doctors').update(doctorRecords.items[0].id, payload);
			} else {
				await pb.collection('doctors').create({
					user: user.id,
					...payload
				});
			}

			message = 'برنامه حضور با موفقیت ذخیره شد';
		} catch (error) {
			message = 'خطا در ذخیره برنامه حضور';
			console.error(error);
		} finally {
			isLoading = false;
		}
	}

	async function loadSchedule() {
		if (!user) return;
		try {
			const doctorRecords = await pb.collection('doctors').getList(1, 1, {
				filter: `user = "${user.id}"`
			});

			if (doctorRecords.items.length > 0) {
				const doctor = doctorRecords.items[0];
				slotDuration = Number(doctor.slot_duration) || 45;
				visitFee = Number(doctor.visit_fee) || 0;
				bio = String(doctor.bio || '');

				const parsed = parseScheduleDates(doctor.schedule_dates);
				if (Object.keys(parsed).length) {
					scheduleDates = parsed;
				} else if (doctor.working_days && Array.isArray(doctor.working_days)) {
					scheduleDates = expandWeeklyToDates(
						doctor.working_days as Parameters<typeof expandWeeklyToDates>[0],
						startOfDay(new Date()),
						90
					);
				} else {
					scheduleDates = {};
				}
			}
		} catch (error) {
			console.error('خطا در بارگذاری برنامه حضور:', error);
		}
	}

	$effect(() => {
		if (user && user.role === 'doctor') {
			loadSchedule();
		}
	});

	const markedCount = $derived(markedDatesFromMap(scheduleDates).length);
</script>

{#if !user || user.role !== 'doctor'}
	<Card class="mx-auto max-w-md rounded-2xl border-border/50 shadow-sm">
		<CardHeader>
			<CardTitle>دسترسی غیرمجاز</CardTitle>
			<CardDescription>فقط روانشناسان می‌توانند به این صفحه دسترسی داشته باشند.</CardDescription>
		</CardHeader>
		<CardContent>
			<a href="/dashboard" class="inline-flex">
				<Button class="rounded-xl">بازگشت به داشبورد</Button>
			</a>
		</CardContent>
	</Card>
{:else}
	<div class="space-y-3">
		<header class="flex flex-wrap items-center justify-between gap-2">
			<div class="min-w-0">
				<h1 class="text-lg font-bold tracking-tight sm:text-xl">ساعات حضور</h1>
				<p class="text-xs text-muted-foreground">
					{markedCount.toLocaleString('fa-IR')} روز ثبت‌شده
				</p>
			</div>
			<Button class="h-9 shrink-0 rounded-xl px-4" onclick={saveSchedule} disabled={isLoading}>
				{isLoading ? 'در حال ذخیره...' : 'ذخیره'}
			</Button>
		</header>

		{#if message}
			<p
				class="rounded-lg px-3 py-1.5 text-xs
					{message.includes('موفقیت') ? 'bg-emerald-50 text-emerald-800' : 'bg-destructive/10 text-destructive'}"
			>
				{message}
			</p>
		{/if}

		<div class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border/50 bg-card px-3 py-2.5">
			<div class="space-y-0.5">
				<Label for="slot-duration" class="text-[10px] text-muted-foreground">مدت جلسه (دقیقه)</Label>
				<Input
					id="slot-duration"
					type="number"
					size="sm"
					leftIcon={Clock}
					class="w-[5.25rem] rounded-lg tabular-nums"
					bind:value={slotDuration}
					min="15"
					max="180"
					dir="ltr"
				/>
			</div>

			<div class="space-y-0.5">
				<Label for="visit-fee" class="text-[10px] text-muted-foreground">هزینه (تومان)</Label>
				<MoneyInput
					id="visit-fee"
					size="sm"
					leftIcon={Wallet}
					class="w-[6.75rem] rounded-lg"
					bind:value={visitFee}
				/>
			</div>

			<Button
				type="button"
				variant="outline"
				size="sm"
				class="ms-auto h-8 shrink-0 gap-1.5 rounded-lg px-3 text-xs"
				onclick={() => (bioOpen = true)}
			>
				بیوگرافی
				<FileText class="h-3.5 w-3.5 opacity-70" />
			</Button>
		</div>

		<Card class="rounded-2xl border-border/50 shadow-sm">
			<CardContent class="p-3 sm:p-4">
				<CalendarScheduleEditor bind:schedule={scheduleDates} bind:selectedDate />
			</CardContent>
		</Card>
	</div>

	<Dialog bind:open={bioOpen} class="max-w-lg">
		<h2 class="text-base font-semibold">بیوگرافی</h2>
		<p class="mt-1 text-xs text-muted-foreground">توضیح کوتاه درباره تخصص و تجربه</p>
		<textarea
			class="mt-3 min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
			bind:value={bio}
			placeholder="توضیحات درباره تخصص و تجربه..."
		></textarea>
		<div class="mt-4 flex justify-end gap-2">
			<Button type="button" variant="outline" class="h-9 rounded-xl" onclick={() => (bioOpen = false)}>
				بستن
			</Button>
			<Button
				type="button"
				class="h-9 rounded-xl"
				onclick={() => {
					bioOpen = false;
					void saveSchedule();
				}}
				disabled={isLoading}
			>
				ذخیره
			</Button>
		</div>
	</Dialog>
{/if}
