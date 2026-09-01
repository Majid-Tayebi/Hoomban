<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { pb } from '$lib/pocketbase';
	import { sendSms, type SmsTemplate } from '$lib/sms';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Select from '$lib/components/ui/select.svelte';
	import Badge from '$lib/components/ui/badge.svelte';

	let user = $derived(getUser());
	let isClinicAdmin = $derived(user?.role === 'admin');

	$effect(() => {
		if (user && user.role !== 'admin') {
			goto('/dashboard/profile');
		}
	});

	let to = $state('');
	let template = $state<SmsTemplate>('appointment_confirmed');
	let doctor = $state('دکتر نمونه');
	let date = $state('');
	let time = $state('');
	let message = $state('');
	let outbox = $state<{ id: string; to: string; template: string; status: string; body: string }[]>([]);

	async function loadOutbox() {
		if (!isClinicAdmin) return;
		try {
			const res = await pb.collection('sms_outbox').getList(1, 20, { sort: '-created' });
			outbox = res.items.map((r) => ({
				id: r.id,
				to: String(r.to),
				template: String(r.template),
				status: String(r.status),
				body: String(r.body || '')
			}));
		} catch {
			outbox = [];
		}
	}

	async function queueSms() {
		message = '';
		const result = await sendSms({
			to,
			template,
			payload: { doctor, date, time, patient: 'بیمار' }
		});
		message = result.ok
			? result.status === 'sent'
				? 'پیامک ارسال شد'
				: result.status === 'queued'
					? 'در صف — ارسال واقعی فقط روی localhost فعال است'
					: result.status === 'stub'
						? 'در صف ثبت شد — SMS.ir پیکربندی نشده'
						: `وضعیت: ${result.status}${result.error ? ` — ${result.error}` : ''}`
			: result.error || 'خطا';
		await loadOutbox();
	}

	$effect(() => {
		if (user) loadOutbox();
	});
</script>

{#if isClinicAdmin}
	<div class="space-y-4">
		<Card class="rounded-2xl shadow-sm">
			<CardHeader>
				<CardTitle class="text-base">سامانه پیامک (SMS.ir)</CardTitle>
				<CardDescription>
					OTP از Verify (قالب Sandbox: 123456) ارسال می‌شود. پیامک‌های نوبت (تأیید، یادآوری، …) از
					Bulk استفاده می‌کنند و به <code class="text-xs">SMSIR_LINE_NUMBER</code> نیاز دارند. در
					Sandbox بدون خط، متن در outbox ثبت می‌شود و API واقعی Bulk فراخوانی نمی‌شود.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-3">
				<div class="space-y-1.5">
					<Label>شماره گیرنده</Label>
					<Input bind:value={to} placeholder="0912xxxxxxx" dir="ltr" />
				</div>
				<div class="space-y-1.5">
					<Label>قالب</Label>
					<Select bind:value={template}>
						<option value="appointment_confirmed">تأیید نوبت</option>
						<option value="appointment_reminder">یادآوری</option>
						<option value="appointment_rescheduled">تغییر زمان نوبت</option>
						<option value="appointment_cancelled">لغو نوبت</option>
						<option value="doctor_new_appointment">اطلاع به روانشناس</option>
					</Select>
				</div>
				<div class="grid grid-cols-3 gap-2">
					<div class="space-y-1">
						<Label class="text-xs">متخصص</Label>
						<Input bind:value={doctor} />
					</div>
					<div class="space-y-1">
						<Label class="text-xs">تاریخ</Label>
						<Input bind:value={date} />
					</div>
					<div class="space-y-1">
						<Label class="text-xs">ساعت</Label>
						<Input bind:value={time} dir="ltr" />
					</div>
				</div>
				<Button class="rounded-xl" onclick={queueSms}>ثبت در صف پیامک</Button>
				{#if message}
					<p class="text-sm">{message}</p>
				{/if}

				<div class="space-y-2 border-t pt-3">
					<p class="text-sm font-medium">آخرین پیام‌های صف</p>
					{#each outbox as row}
						<div class="rounded-xl border px-3 py-2 text-xs">
							<div class="mb-1 flex items-center gap-2">
								<span dir="ltr">{row.to}</span>
								<Badge variant="outline">{row.status}</Badge>
								<span class="text-muted-foreground">{row.template}</span>
							</div>
							<p class="text-muted-foreground">{row.body}</p>
						</div>
					{:else}
						<p class="text-xs text-muted-foreground">صف خالی است.</p>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>
{/if}
