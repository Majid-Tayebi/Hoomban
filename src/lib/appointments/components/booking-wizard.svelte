<script lang="ts">
	import type { AuthUser } from '$lib/auth.svelte';
	import type {
		BookingClient,
		BookingDoctor,
		BookingPath,
		BookingService,
		BookingSlot,
		BookingTimelineStep
	} from '../booking-types';
	import {
		createInPersonAppointment,
		createServiceAppointment,
		fullClientName,
		invalidateBookingCatalogCache,
		loadBookingDoctors,
		loadBookingServices,
		resolvePatientId,
		validateMobile
	} from '../services/booking';
	import BookingTimeline from './booking-timeline.svelte';
	import SpecialistPickList from './specialist-pick-list.svelte';
	import ServicePickList from './service-pick-list.svelte';
	import BookingDatetimePanel from './booking-datetime-panel.svelte';
	import BookingServiceDatetimePanel from './booking-service-datetime-panel.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { formatFaDate } from '$lib/date';
	import { formatToman } from '$lib/money';
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	import { Stethoscope, Tag } from '@lucide/svelte';

	let {
		user,
		deskMode = true,
		variant = 'page',
		initialDoctorId = null as string | null,
		onSuccess,
		onCancel
	}: {
		user: NonNullable<AuthUser>;
		deskMode?: boolean;
		variant?: 'page' | 'modal';
		initialDoctorId?: string | null;
		onSuccess?: () => void;
		onCancel?: () => void;
	} = $props();

	const deskSteps: BookingTimelineStep[] = [
		{ id: 1, title: 'مشخصات مراجع', description: 'نام، نام خانوادگی و موبایل' },
		{ id: 2, title: 'انتخاب نوبت', description: 'خدمات یا متخصص' },
		{ id: 3, title: 'تاریخ و ساعت', description: 'تقویم و اسلات‌های آزاد' },
		{ id: 4, title: 'تأیید و رزرو', description: 'بررسی نهایی و ثبت نوبت' }
	];

	const selfSteps: BookingTimelineStep[] = [
		{ id: 1, title: 'انتخاب متخصص', description: 'روانشناس مورد نظر' },
		{ id: 2, title: 'تاریخ و ساعت', description: 'تقویم و اسلات‌های آزاد' },
		{ id: 3, title: 'تأیید و رزرو', description: 'بررسی نهایی و ثبت نوبت' }
	];

	const steps = $derived(deskMode ? deskSteps : selfSteps);

	let currentStep = $state(1);
	let client = $state<BookingClient>({ firstName: '', lastName: '', mobile: '' });
	let doctors = $state<BookingDoctor[]>([]);
	let services = $state<BookingService[]>([]);
	let loadingDoctors = $state(false);
	let loadingServices = $state(false);
	let bookingPath = $state<BookingPath | null>(null);
	let selectedDoctor = $state<BookingDoctor | null>(null);
	let selectedService = $state<BookingService | null>(null);
	let selectedDate = $state(new Date());
	let selectedSlot = $state<BookingSlot | null>(null);
	let booking = $state(false);
	let message = $state('');
	let clientError = $state('');
	let catalogsLoaded = $state(false);

	const isFinalStep = $derived(deskMode ? currentStep === 4 : currentStep === 3);
	const isDatetimeStep = $derived(deskMode ? currentStep === 3 : currentStep === 2);
	const isSpecialistStep = $derived(deskMode ? currentStep === 2 : currentStep === 1);
	const isServiceBooking = $derived(deskMode && bookingPath === 'service');
	const clientLabel = $derived(
		deskMode ? fullClientName(client) || '—' : user.name || 'مراجع'
	);

	const stepTitle = $derived(steps.find((s) => s.id === currentStep)?.title ?? '');
	const showStepTitle = $derived(!isSpecialistStep);

	const canProceedFromPickStep = $derived(
		deskMode
			? bookingPath === 'specialist'
				? Boolean(selectedDoctor)
				: bookingPath === 'service'
					? Boolean(selectedService)
					: false
			: Boolean(selectedDoctor)
	);

	async function ensureCatalogs() {
		if (catalogsLoaded || loadingDoctors || loadingServices) return;
		loadingDoctors = true;
		if (deskMode) loadingServices = true;
		try {
			const [doctorList, serviceList] = await Promise.all([
				loadBookingDoctors(),
				deskMode ? loadBookingServices() : Promise.resolve([] as BookingService[])
			]);
			doctors = doctorList;
			services = serviceList;
			catalogsLoaded = true;
			if (initialDoctorId && !selectedDoctor) {
				const preset = doctorList.find((d) => d.id === initialDoctorId);
				if (preset) {
					selectedDoctor = preset;
					bookingPath = 'specialist';
				}
			}
		} catch {
			doctors = [];
			services = [];
		} finally {
			loadingDoctors = false;
			loadingServices = false;
		}
	}

	function validateClientStep(): boolean {
		clientError = '';
		if (!client.firstName.trim() || !client.lastName.trim()) {
			clientError = 'نام و نام خانوادگی را وارد کنید';
			return false;
		}
		if (!validateMobile(client.mobile)) {
			clientError = 'موبایل را به‌صورت ۰۹xxxxxxxxx وارد کنید';
			return false;
		}
		return true;
	}

	function setBookingPath(path: BookingPath) {
		bookingPath = path;
		message = '';
		if (path === 'specialist') {
			selectedService = null;
		} else {
			selectedDoctor = null;
		}
		selectedSlot = null;
	}

	function goNext() {
		message = '';
		if (deskMode && currentStep === 1) {
			if (!validateClientStep()) return;
			currentStep = 2;
			return;
		}
		if ((deskMode && currentStep === 2) || (!deskMode && currentStep === 1)) {
			if (!canProceedFromPickStep) {
				message = deskMode
					? bookingPath === 'service'
						? 'یک خدمت انتخاب کنید'
						: bookingPath === 'specialist'
							? 'یک متخصص انتخاب کنید'
							: 'نوع نوبت را انتخاب کنید'
					: 'یک متخصص انتخاب کنید';
				return;
			}
			currentStep = deskMode ? 3 : 2;
			return;
		}
		if ((deskMode && currentStep === 3) || (!deskMode && currentStep === 2)) {
			if (!selectedSlot) {
				message = 'ساعت نوبت را انتخاب کنید';
				return;
			}
			currentStep = deskMode ? 4 : 3;
		}
	}

	function selectDoctor(doctor: BookingDoctor) {
		selectedDoctor = doctor;
		selectedService = null;
		bookingPath = 'specialist';
		selectedSlot = null;
		message = '';
		currentStep = deskMode ? 3 : 2;
	}

	function selectService(service: BookingService) {
		selectedService = service;
		selectedDoctor = null;
		bookingPath = 'service';
		selectedSlot = null;
		message = '';
		currentStep = 3;
	}

	function cancel() {
		if (variant === 'modal') {
			onCancel?.();
			return;
		}
		goto('/dashboard');
	}

	async function confirmBooking() {
		if (!selectedSlot) return;
		if (isServiceBooking && !selectedService) return;
		if (!isServiceBooking && !selectedDoctor) return;

		booking = true;
		message = '';
		try {
			if (user.id === 'demo-user') {
				message = 'در حالت نمایشی نوبت ذخیره نمی‌شود.';
				if (variant === 'modal') {
					setTimeout(() => onSuccess?.(), 1200);
				} else {
					setTimeout(() => goto('/dashboard'), 1400);
				}
				return;
			}

			let patientId = user.id;
			if (deskMode) {
				if (!validateClientStep()) {
					currentStep = 1;
					return;
				}
				patientId = await resolvePatientId(client);
			}

			if (isServiceBooking && selectedService) {
				await createServiceAppointment({
					patientId,
					service: selectedService,
					slot: selectedSlot
				});
			} else if (selectedDoctor) {
				await createInPersonAppointment({
					patientId,
					doctorId: selectedDoctor.id,
					slot: selectedSlot
				});
			}

			message = 'نوبت با موفقیت رزرو شد';
			invalidateBookingCatalogCache();
			if (variant === 'modal') {
				setTimeout(() => onSuccess?.(), 900);
			} else {
				setTimeout(() => goto('/dashboard/appointments'), 1400);
			}
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'خطا در رزرو نوبت';
		} finally {
			booking = false;
		}
	}

	$effect(() => {
		if (!user) return;
		const needsCatalog = deskMode ? currentStep >= 2 : currentStep >= 1;
		if (needsCatalog) void ensureCatalogs();
	});
</script>

<div class={cn(variant === 'page' && 'rounded-2xl border border-border/60 bg-card shadow-sm')}>
<div
	class={cn(
		'grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]',
		variant === 'modal' && 'max-h-[min(85dvh,780px)] overflow-y-auto'
	)}
>
			<div class="border-b border-border/50 p-4 sm:p-5 lg:border-b-0 lg:border-e {variant === 'modal' ? 'bg-muted/20' : ''}">
				<p class="mb-4 text-xs font-medium text-muted-foreground">مراحل رزرو حضوری</p>
				<BookingTimeline {steps} {currentStep} />
			</div>

			<div class="flex min-w-0 flex-col p-4 sm:p-6">
				{#if showStepTitle}
					<div class="mb-4">
						<h2 class="text-base font-semibold">{stepTitle}</h2>
					</div>
				{/if}

				<div class="min-w-0 flex-1 space-y-4">
					{#if deskMode && currentStep === 1}
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div class="space-y-1.5">
								<Label for="fn">نام</Label>
								<Input
									id="fn"
									bind:value={client.firstName}
									placeholder="مثلاً سارا"
									class="rounded-xl"
								/>
							</div>
							<div class="space-y-1.5">
								<Label for="ln">نام خانوادگی</Label>
								<Input
									id="ln"
									bind:value={client.lastName}
									placeholder="مثلاً محمدی"
									class="rounded-xl"
								/>
							</div>
						</div>
						<div class="space-y-1.5">
							<Label for="mob">شماره موبایل</Label>
							<Input
								id="mob"
								bind:value={client.mobile}
								placeholder="0912xxxxxxx"
								dir="ltr"
								class="rounded-xl"
							/>
						</div>
						{#if clientError}
							<p class="text-sm text-destructive">{clientError}</p>
						{/if}
					{:else if isSpecialistStep}
						{#if deskMode}
							<div class="inline-flex w-full rounded-xl border border-border/60 bg-muted/30 p-1 sm:w-auto">
								<button
									type="button"
									class={cn(
										'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 sm:flex-none sm:min-w-[8.5rem]',
										bookingPath === 'specialist'
											? 'bg-foreground text-background shadow-sm'
											: 'text-muted-foreground hover:text-foreground'
									)}
									onclick={() => setBookingPath('specialist')}
								>
									<Stethoscope class="h-4 w-4" />
									متخصص
								</button>
								<button
									type="button"
									class={cn(
										'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 sm:flex-none sm:min-w-[8.5rem]',
										bookingPath === 'service'
											? 'bg-foreground text-background shadow-sm'
											: 'text-muted-foreground hover:text-foreground'
									)}
									onclick={() => setBookingPath('service')}
								>
									<Tag class="h-4 w-4" />
									خدمات
								</button>
							</div>

							{#if bookingPath === 'specialist'}
								<SpecialistPickList
									{doctors}
									selectedId={selectedDoctor?.id ?? null}
									loading={loadingDoctors}
									onSelect={selectDoctor}
								/>
							{:else if bookingPath === 'service'}
								<ServicePickList
									{services}
									selectedId={selectedService?.id ?? null}
									loading={loadingServices}
									onSelect={selectService}
								/>
							{:else}
								<p class="py-10 text-center text-sm text-muted-foreground">
									برای ادامه، «متخصص» یا «خدمات» را انتخاب کنید.
								</p>
							{/if}
						{:else}
							<SpecialistPickList
								{doctors}
								selectedId={selectedDoctor?.id ?? null}
								loading={loadingDoctors}
								onSelect={selectDoctor}
							/>
						{/if}
					{:else if isDatetimeStep}
						{#if isServiceBooking && selectedService}
							<BookingServiceDatetimePanel
								service={selectedService}
								bind:selectedDate
								bind:selectedSlot
							/>
						{:else if selectedDoctor}
							<BookingDatetimePanel
								doctor={selectedDoctor}
								bind:selectedDate
								bind:selectedSlot
							/>
						{/if}
					{:else}
						<div class="space-y-3">
							<div class="rounded-xl border border-border/60 p-3.5">
								<p class="text-xs text-muted-foreground">مراجع</p>
								<p class="mt-0.5 text-sm font-medium">{clientLabel}</p>
								{#if deskMode}
									<p class="mt-0.5 text-xs text-muted-foreground" dir="ltr">{client.mobile}</p>
								{/if}
							</div>
							{#if isServiceBooking && selectedService}
								<div class="rounded-xl border border-border/60 p-3.5">
									<p class="text-xs text-muted-foreground">خدمت</p>
									<p class="mt-0.5 text-sm font-medium">{selectedService.title}</p>
									{#if selectedService.category}
										<p class="text-xs text-muted-foreground">{selectedService.category}</p>
									{/if}
									{#if selectedService.price > 0}
										<p class="mt-1 text-xs tabular-nums text-muted-foreground">
											{formatToman(selectedService.price)}
										</p>
									{/if}
								</div>
							{:else if selectedDoctor}
								<div class="rounded-xl border border-border/60 p-3.5">
									<p class="text-xs text-muted-foreground">متخصص</p>
									<p class="mt-0.5 text-sm font-medium">{selectedDoctor.name}</p>
									<p class="text-xs text-muted-foreground">{selectedDoctor.specialty}</p>
								</div>
							{/if}
							<div class="rounded-xl border border-border/60 p-3.5">
								<p class="text-xs text-muted-foreground">زمان</p>
								<p class="mt-0.5 text-sm font-medium">
									{formatFaDate(selectedDate)} — {selectedSlot?.time}
								</p>
								<p class="text-xs text-muted-foreground">حضوری</p>
							</div>
						</div>
					{/if}

					{#if message}
						<p
							class="rounded-xl px-3 py-2 text-sm {message.includes('موفقیت') ||
							message.includes('نمایشی')
								? 'bg-accent text-accent-foreground'
								: 'bg-destructive/10 text-destructive'}"
							role="alert"
						>
							{message}
						</p>
					{/if}
				</div>

				<div class="mt-6 flex items-center justify-between gap-3 border-t border-border/50 pt-4">
					{#if isFinalStep}
						<Button class="h-11 min-w-[120px] rounded-xl" disabled={booking} onclick={confirmBooking}>
							{booking ? 'در حال رزرو...' : 'رزرو'}
						</Button>
					{:else}
						<Button
							class="h-11 min-w-[120px] rounded-xl"
							disabled={booking ||
								(isSpecialistStep ? !canProceedFromPickStep : false) ||
								(isDatetimeStep ? !selectedSlot : false)}
							onclick={goNext}
						>
							ادامه
						</Button>
					{/if}
					<Button
						variant="outline"
						class="h-11 min-w-[120px] rounded-xl"
						disabled={booking}
						onclick={cancel}
					>
						انصراف
					</Button>
				</div>
			</div>
</div>
</div>
