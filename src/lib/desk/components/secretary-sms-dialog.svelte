<script lang="ts">
	import { sendSms, type SmsTemplate } from '$lib/sms';
	import Button from '$lib/components/ui/button.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Select from '$lib/components/ui/select.svelte';
	import { LoaderCircle, MessageSquareText } from '@lucide/svelte';

	let {
		open = $bindable(false),
		phone = '',
		patientName = '',
		defaultTemplate = 'appointment_confirmed' as SmsTemplate,
		appointmentDate = '',
		appointmentTime = '',
		doctorName = '',
		onSent
	}: {
		open?: boolean;
		phone?: string;
		patientName?: string;
		defaultTemplate?: SmsTemplate;
		appointmentDate?: string;
		appointmentTime?: string;
		doctorName?: string;
		onSent?: () => void;
	} = $props();

	let templateMode = $state<SmsTemplate | 'custom'>('appointment_confirmed');
	let date = $state('');
	let time = $state('');
	let doctor = $state('');
	let customBody = $state('');
	let sending = $state(false);
	let message = $state('');
	let error = $state('');

	const lockScheduleFields = $derived(
		templateMode !== 'custom' &&
			Boolean(appointmentDate && appointmentTime) &&
			(templateMode === 'appointment_confirmed' || templateMode === 'appointment_reminder')
	);

	$effect(() => {
		if (open) {
			templateMode = defaultTemplate;
			date = appointmentDate;
			time = appointmentTime;
			doctor = doctorName;
			customBody = '';
			message = '';
			error = '';
			sending = false;
		}
	});

	async function submit() {
		if (!phone || phone.replace(/\D/g, '').length < 10) {
			error = 'شماره موبایل مراجع موجود نیست';
			return;
		}

		sending = true;
		error = '';
		message = '';

		try {
			const result =
				templateMode === 'custom'
					? await sendSms({ to: phone, body: customBody.trim() })
					: await sendSms({
							to: phone,
							template: templateMode,
							payload: {
								patient: patientName,
								doctor: doctor || 'متخصص',
								date,
								time
							}
						});

			if (!result.ok) {
				error = result.error || 'ارسال ناموفق بود';
				return;
			}

			message =
				result.status === 'sent'
					? 'پیامک ارسال شد'
					: result.status === 'queued'
						? 'در صف ثبت شد — ارسال واقعی در production فعال می‌شود'
						: `ثبت شد (وضعیت: ${result.status})`;
			onSent?.();
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'ارسال ناموفق بود';
		} finally {
			sending = false;
		}
	}
</script>

<Dialog bind:open class="max-w-md">
	<div class="space-y-4 text-right">
		<div class="flex items-start gap-2">
			<MessageSquareText class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
			<div>
				<h3 class="text-base font-semibold">ارسال پیامک به مراجع</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					{#if patientName}
						{patientName} —
					{/if}
					<span dir="ltr">{phone || '—'}</span>
				</p>
			</div>
		</div>

		<div class="space-y-1.5">
			<Label>قالب پیام</Label>
			<Select bind:value={templateMode}>
				<option value="appointment_confirmed">تأیید نوبت</option>
				<option value="appointment_reminder">یادآوری نوبت</option>
				<option value="appointment_cancelled">لغو نوبت</option>
				<option value="custom">متن دلخواه</option>
			</Select>
		</div>

		{#if templateMode !== 'custom'}
			<div class="grid grid-cols-2 gap-2">
				<div class="space-y-1">
					<Label class="text-xs">تاریخ (نمایشی)</Label>
					<Input
						bind:value={date}
						placeholder="۱۴۰۴/۰۶/۱۰"
						readonly={lockScheduleFields}
						class={lockScheduleFields ? 'bg-muted/60' : ''}
					/>
				</div>
				<div class="space-y-1">
					<Label class="text-xs">ساعت</Label>
					<Input
						bind:value={time}
						dir="ltr"
						placeholder="۱۴:۳۰"
						readonly={lockScheduleFields}
						class={lockScheduleFields ? 'bg-muted/60' : ''}
					/>
				</div>
			</div>
			<div class="space-y-1">
				<Label class="text-xs">متخصص</Label>
				<Input bind:value={doctor} />
			</div>
		{:else}
			<div class="space-y-1.5">
				<Label>متن پیامک</Label>
				<textarea
					class="min-h-[6rem] w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring"
					bind:value={customBody}
					maxlength={500}
					placeholder="متن پیامک را بنویسید..."
				></textarea>
			</div>
		{/if}

		{#if error}
			<p class="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
		{/if}
		{#if message}
			<p class="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
				{message}
			</p>
		{/if}

		<div class="flex gap-2 pt-1">
			<Button variant="outline" class="flex-1 rounded-xl" onclick={() => (open = false)} disabled={sending}>
				بستن
			</Button>
			<Button
				class="flex-1 rounded-xl"
				disabled={sending || (templateMode === 'custom' && !customBody.trim())}
				onclick={submit}
			>
				{#if sending}
					<LoaderCircle class="h-4 w-4 animate-spin" />
				{:else}
					ارسال پیامک
				{/if}
			</Button>
		</div>
	</div>
</Dialog>
