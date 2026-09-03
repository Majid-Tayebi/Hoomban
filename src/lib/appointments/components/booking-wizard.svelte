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
		resolveServiceBookingDoctorId,
		slotToIsoDateTime,
		validateMobile
	} from '../services/booking';
	import {
		fetchZarinpalGatewayStatus,
		startAppointmentOnlineCheckout,
		type ZarinpalGatewayStatus
	} from '$lib/payments/zarinpal-client';
	import BookingTimeline from './booking-timeline.svelte';
	import SpecialistPickList from './specialist-pick-list.svelte';
	import ServicePickList from './service-pick-list.svelte';
	import BookingDatetimePanel from './booking-datetime-panel.svelte';
	import BookingServiceDatetimePanel from './booking-service-datetime-panel.svelte';
	import BookingConfirmSummary from './booking-confirm-summary.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { formatFaDate } from '$lib/date';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils';
	import { Stethoscope, Tag, ArrowRight } from '@lucide/svelte';

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
		{ id: 1, title: 'انتخاب نوبت', description: 'خدمات یا متخصص' },
		{ id: 2, title: 'تاریخ و ساعت', description: 'مشاهده وقت‌های خالی' },
		{ id: 3, title: 'مشخصات مراجع', description: 'فقط برای ثبت نهایی نوبت' },
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
	let gatewayStatus = $state<ZarinpalGatewayStatus | null>(null);
	let loadingGatewayStatus = $state(false);

	const isFinalStep = $derived(deskMode ? currentStep === 4 : currentStep === 3);
	const isPatientStep = $derived(deskMode && currentStep === 3);
	const isDatetimeStep = $derived(deskMode ? currentStep === 2 : currentStep === 2);
	const isSpecialistStep = $derived(deskMode ? currentStep === 1 : currentStep === 1);
	const isServiceBooking = $derived(deskMode && bookingPath === 'service');
	const clientLabel = $derived(
		deskMode ? fullClientName(client) || '—' : user.name || 'مراجع'
	);

	const stepTitle = $derived(steps.find((s) => s.id === currentStep)?.title ?? '');
	const showStepTitle = $derived(!isSpecialistStep);
	const bookingAmountToman = $derived(
		isServiceBooking && selectedService
			? Math.max(0, Math.round(selectedService.price))
			: selectedDoctor
				? Math.max(0, Math.round(selectedDoctor.visitFee))
				: 0
	);
	const shouldPayOnline = $derived(
		!deskMode && Boolean(gatewayStatus?.configured) && bookingAmountToman > 0
	);
	const confirmButtonLabel = $derived(
		booking
			? shouldPayOnline
				? 'در حال انتقال به درگاه...'
				: 'در حال رزرو...'
			: shouldPayOnline
				? 'پرداخت و رزرو'
				: 'رزرو'
	);

	const canGoBack = $derived(currentStep > 1);
	const modalContentMinH = $derived(variant === 'modal' ? 'min-h-[min(52dvh,440px)]' : '');
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
		if (isSpecialistStep) {
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
			currentStep = 2;
			return;
		}
		if (isDatetimeStep) {
			if (!selectedSlot) {
				message = 'برای رزرو، یک ساعت انتخاب کنید';
				return;
			}
			currentStep = deskMode ? 3 : 3;
			return;
		}
		if (isPatientStep) {
			if (!validateClientStep()) return;
			currentStep = 4;
		}
	}

	function selectDoctor(doctor: BookingDoctor) {
		selectedDoctor = doctor;
		selectedService = null;
		bookingPath = 'specialist';
		selectedSlot = null;
		message = '';
		currentStep = 2;
	}

	function selectService(service: BookingService) {
		selectedService = service;
		selectedDoctor = null;
		bookingPath = 'service';
		selectedSlot = null;
		message = '';
		currentStep = 2;
	}

	function goBack() {
		message = '';
		clientError = '';
		if (currentStep <= 1) return;
		currentStep -= 1;
	}

	function cancel() {
		if (variant === 'modal') {
			onCancel?.();
			return;
		}
		goto(resolve('/dashboard'));
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
					setTimeout(() => goto(resolve('/dashboard')), 1400);
				}
				return;
			}

			let patientId = user.id;
			if (deskMode) {
				if (!validateClientStep()) {
					currentStep = 3;
					return;
				}
				patientId = await resolvePatientId(client);
			}

			if (shouldPayOnline) {
				if (isServiceBooking && selectedService) {
					const doctorId = await resolveServiceBookingDoctorId();
					const { paymentUrl } = await startAppointmentOnlineCheckout({
						patientId,
						doctorId,
						dateTime: slotToIsoDateTime(selectedSlot),
						type: 'service',
						serviceId: selectedService.id
					});
					window.location.href = paymentUrl;
					return;
				}
				if (selectedDoctor) {
					const { paymentUrl } = await startAppointmentOnlineCheckout({
						patientId,
						doctorId: selectedDoctor.id,
						dateTime: slotToIsoDateTime(selectedSlot),
						type: 'in_person'
					});
					window.location.href = paymentUrl;
					return;
				}
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
				setTimeout(() => goto(resolve('/dashboard/appointments')), 1400);
			}
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'خطا در رزرو نوبت';
		} finally {
			booking = false;
		}
	}

	$effect(() => {
		if (!user) return;
		if (currentStep >= 1) void ensureCatalogs();
	});

	$effect(() => {
		if (deskMode || !isFinalStep || gatewayStatus || loadingGatewayStatus) return;
		loadingGatewayStatus = true;
		void fetchZarinpalGatewayStatus()
			.then((status) => {
				gatewayStatus = status;
			})
			.catch(() => {
				gatewayStatus = { configured: false, sandbox: true };
			})
			.finally(() => {
				loadingGatewayStatus = false;
			});
	});
</script>

<div class={cn(variant === 'page' && 'rounded-2xl border border-border/60 bg-card shadow-sm')} data-testid="booking-wizard">
<div
	class={cn(
		'grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]',
		variant === 'modal' && 'max-h-[min(85dvh,780px)] min-h-[min(72dvh,640px)] overflow-y-auto'
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

				<div class={cn('min-w-0 flex-1 space-y-4', modalContentMinH)}>
					{#if isPatientStep}
						<div class="rounded-xl border border-primary/20 bg-primary/[0.04] p-3.5">
							<p class="text-xs font-medium text-muted-foreground">نوبت انتخاب‌شده</p>
							{#if isServiceBooking && selectedService}
								<p class="mt-1 text-sm font-semibold">{selectedService.title}</p>
								{#if selectedService.category}
									<p class="text-xs text-muted-foreground">{selectedService.category}</p>
								{/if}
							{:else if selectedDoctor}
								<p class="mt-1 text-sm font-semibold">{selectedDoctor.name}</p>
								<p class="text-xs text-muted-foreground">{selectedDoctor.specialty}</p>
							{/if}
							{#if selectedSlot}
								<p class="mt-2 text-sm tabular-nums text-foreground">
									{formatFaDate(selectedDate)} — {selectedSlot.time}
								</p>
							{/if}
						</div>
						<p class="text-xs leading-relaxed text-muted-foreground">
							فقط برای ثبت نهایی نوبت لازم است.
						</p>
						<div
							class="rounded-xl border border-border/60 bg-card/50 p-4 sm:p-5"
							dir="rtl"
						>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div class="flex min-w-0 flex-col gap-1.5 text-right">
									<Label for="fn">نام</Label>
									<Input
										id="fn"
										bind:value={client.firstName}
										placeholder="مثلاً سارا"
										class="rounded-xl"
									/>
								</div>
								<div class="flex min-w-0 flex-col gap-1.5 text-right">
									<Label for="ln">نام خانوادگی</Label>
									<Input
										id="ln"
										bind:value={client.lastName}
										placeholder="مثلاً محمدی"
										class="rounded-xl"
									/>
								</div>
							</div>
							<div class="mt-4 flex min-w-0 flex-col gap-1.5 text-right">
								<Label for="mob">شماره موبایل</Label>
								<Input
									id="mob"
									bind:value={client.mobile}
									placeholder="0912xxxxxxx"
									dir="ltr"
									class="rounded-xl text-left"
								/>
							</div>
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
						{#if deskMode}
							<p class="rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-sm text-muted-foreground">
								می‌توانید فقط وقت‌های خالی را ببینید. برای رزرو، یک ساعت انتخاب کنید و ادامه
								دهید.
							</p>
						{/if}
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
						<BookingConfirmSummary
							{clientLabel}
							clientMobile={client.mobile}
							{deskMode}
							{selectedDoctor}
							{selectedService}
							{isServiceBooking}
							{selectedDate}
							{selectedSlot}
							{bookingAmountToman}
							{shouldPayOnline}
							{gatewayStatus}
						/>
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
							{confirmButtonLabel}
						</Button>
					{:else}
						<Button
							class="h-11 min-w-[120px] rounded-xl"
							disabled={booking ||
								(isSpecialistStep ? !canProceedFromPickStep : false) ||
								(isDatetimeStep ? !selectedSlot : false)}
							onclick={goNext}
						>
							{isDatetimeStep && deskMode ? 'ادامه و ثبت مراجع' : 'ادامه'}
						</Button>
					{/if}
					<div class="flex items-center gap-2">
						{#if canGoBack}
							<Button
								variant="outline"
								class="h-11 gap-1.5 rounded-xl"
								disabled={booking}
								onclick={goBack}
							>
								<ArrowRight class="h-4 w-4" />
								برگشت
							</Button>
						{/if}
						<Button
							variant="outline"
							class="h-11 min-w-[100px] rounded-xl"
							disabled={booking}
							onclick={cancel}
						>
							انصراف
						</Button>
					</div>
				</div>
			</div>
</div>
</div>
