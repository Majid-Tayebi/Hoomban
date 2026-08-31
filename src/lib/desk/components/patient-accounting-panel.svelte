<script lang="ts">
	import type { LedgerRow, PaymentMethod, PatientDeskAccounting, PaymentStatus } from '../types';
	import {
		formatToman,
		paymentStatusClass,
		PAYMENT_METHOD_LABELS,
		PAYMENT_STATUS_LABELS
	} from '../types';
	import {
		PAYMENT_MODE_LABELS,
		buildPaymentNotes,
		computeInstallmentPreview,
		type PaymentMode
	} from '../payment-plan';
	import { recordPayment, recordWaiver, applyPaymentToAccounting } from '../services/accounting';
	import LedgerAmountCell from './ledger-amount-cell.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import MoneyInput from '$lib/components/ui/money-input.svelte';
	import Select from '$lib/components/ui/select.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import { CreditCard, Receipt, AlertCircle } from '@lucide/svelte';

	let {
		patientUserId,
		userId,
		accounting = $bindable(),
		onUpdated
	}: {
		patientUserId: string;
		userId: string;
		accounting: PatientDeskAccounting;
		onUpdated?: () => void | Promise<void>;
	} = $props();

	let dialogOpen = $state(false);
	let saving = $state(false);
	let saveError = $state('');
	let saveSuccess = $state('');
	let selectedRow = $state<LedgerRow | null>(null);
	let paymentMode = $state<PaymentMode>('full');
	let installmentCount = $state<'2' | '3'>('2');
	let paidAmount = $state(0);
	let method = $state<PaymentMethod>('cash');
	let notes = $state('');

	let waivedAmount = $state(0);

	const remainingDue = $derived(
		selectedRow
			? Math.max(0, selectedRow.expectedAmount - selectedRow.paidAmount - selectedRow.waivedAmount)
			: 0
	);

	const installmentPreview = $derived.by(() => {
		if (paymentMode !== 'installment' || !selectedRow) return null;
		return computeInstallmentPreview(
			remainingDue,
			paidAmount,
			Number(installmentCount) as 2 | 3
		);
	});

	function formatDate(d: Date): string {
		return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function resetDialogState(row: LedgerRow) {
		paymentMode = row.status === 'waived' ? 'waived' : 'full';
		installmentCount = '2';
		paidAmount = Math.max(0, row.expectedAmount - row.paidAmount - row.waivedAmount) || 0;
		waivedAmount = Math.max(0, row.expectedAmount - row.paidAmount - row.waivedAmount) || 0;
		method = row.method || 'cash';
		notes = row.notes || '';
		saveError = '';
	}

	function openPayment(row: LedgerRow) {
		selectedRow = row;
		resetDialogState(row);
		if (row.status === 'partial') {
			paymentMode = 'installment';
			paidAmount = 0;
		}
		dialogOpen = true;
	}

	function validateBeforeSave(): string | null {
		if (!selectedRow) return 'ردیف انتخاب نشده است.';
		if (!userId) return 'کاربر وارد نشده است. دوباره وارد شوید.';

		if (paymentMode === 'waived') {
			if (waivedAmount <= 0) return 'مبلغ بخشودگی را وارد کنید.';
			if (waivedAmount > remainingDue) return 'مبلغ بخشودگی بیشتر از مانده حساب است.';
			return null;
		}

		if (paymentMode === 'full') {
			if (remainingDue <= 0) return 'مانده‌ای برای تسویه وجود ندارد.';
			return null;
		}

		const first = paidAmount;
		if (first <= 0) return 'مبلغ قسط اول را وارد کنید.';
		if (first > remainingDue) return 'مبلغ قسط اول بیشتر از مانده حساب است.';
		return null;
	}

	async function submitPayment() {
		if (!selectedRow) return;

		const validationError = validateBeforeSave();
		if (validationError) {
			saveError = validationError;
			return;
		}

		saving = true;
		saveError = '';
		saveSuccess = '';

		try {
			const paymentNotes = buildPaymentNotes({
				userNotes: notes,
				paymentMode,
				installmentCount:
					paymentMode === 'installment' ? (Number(installmentCount) as 2 | 3) : undefined,
				installmentPaidThis:
					paymentMode === 'installment' ? paidAmount : undefined,
				remainingAfter: installmentPreview?.leftAfterFirst,
				waivedAmount: paymentMode === 'waived' ? waivedAmount : undefined,
				remainingAfterWaiver:
					paymentMode === 'waived' ? Math.max(0, remainingDue - waivedAmount) : undefined
			});

			let saved: {
				transactionId: string;
				status: PaymentStatus;
				paidAmount: number;
				waivedAmount: number;
			};

			if (paymentMode === 'waived') {
				saved = await recordWaiver({
					patientUserId,
					appointmentId: selectedRow.appointmentId,
					title: selectedRow.title,
					expectedAmount: selectedRow.expectedAmount,
					currentPaidAmount: selectedRow.paidAmount,
					currentWaivedAmount: selectedRow.waivedAmount,
					waivedAmountThisTime: waivedAmount,
					userId,
					transactionId: selectedRow.transactionId,
					notes: paymentNotes
				});
			} else {
				const amountThisPayment =
					paymentMode === 'full' ? remainingDue : paidAmount;
				const newTotalPaid = selectedRow.paidAmount + amountThisPayment;

				saved = await recordPayment({
					patientUserId,
					appointmentId: selectedRow.appointmentId,
					title: selectedRow.title,
					expectedAmount: selectedRow.expectedAmount,
					paidAmount: newTotalPaid,
					method,
					notes: paymentNotes,
					userId,
					transactionId: selectedRow.transactionId
				});
			}

			accounting = applyPaymentToAccounting(accounting, selectedRow, saved, method, paymentNotes);
			dialogOpen = false;
			saveSuccess =
				paymentMode === 'waived'
					? waivedAmount >= remainingDue
						? 'بخشودگی کامل ثبت شد.'
						: 'بخشودگی جزئی ثبت شد.'
					: paymentMode === 'installment'
						? 'قسط اول با موفقیت ثبت شد.'
						: 'تسویه کامل با موفقیت ثبت شد.';
			await onUpdated?.();
		} catch (e: unknown) {
			const err = e as {
				isAbort?: boolean;
				message?: string;
				response?: { message?: string; data?: Record<string, { message?: string }> };
			};
			if (err.isAbort) {
				saveError = 'درخواست لغو شد. لطفاً دوباره «تأیید و ذخیره» را بزنید.';
				return;
			}
			const fieldErrors = err.response?.data
				? Object.values(err.response.data)
						.map((v) => v?.message)
						.filter(Boolean)
						.join(' — ')
				: '';
			saveError =
				fieldErrors ||
				err.response?.message ||
				err.message ||
				'ثبت پرداخت انجام نشد. اتصال به سرور را بررسی کنید.';
		} finally {
			saving = false;
		}
	}

	$effect(() => {
		if (!selectedRow || !dialogOpen) return;
		if (paymentMode === 'full') {
			paidAmount = remainingDue;
		} else if (paymentMode === 'waived') {
			waivedAmount = remainingDue;
		}
	});
</script>

<Card class="rounded-2xl border-border/60 shadow-sm">
	<CardHeader class="flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4 sm:px-5">
		<div class="flex items-center gap-2">
			<Receipt class="h-4 w-4 text-primary" />
			<CardTitle class="text-sm font-semibold sm:text-base">حسابداری مراجع</CardTitle>
		</div>
	</CardHeader>

	<CardContent class="px-2 pb-4 sm:px-5">
		<div class="mb-3 grid grid-cols-2 gap-2 px-1 sm:grid-cols-4 sm:px-0">
			<div class="rounded-xl bg-muted/40 px-3 py-2">
				<p class="text-[11px] text-muted-foreground">مانده حساب</p>
				<p
					class="mt-0.5 text-sm font-semibold {accounting.summary.balance > 0
						? 'text-red-600 dark:text-red-400'
						: 'text-muted-foreground'}"
				>
					{formatToman(accounting.summary.balance)}
				</p>
			</div>
			<div class="rounded-xl bg-muted/40 px-3 py-2">
				<p class="text-[11px] text-muted-foreground">درآمد ثبت‌شده</p>
				<p class="mt-0.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
					{formatToman(accounting.summary.totalPaid)}
				</p>
			</div>
			<div class="rounded-xl bg-muted/40 px-3 py-2">
				<p class="text-[11px] text-muted-foreground">جمع هزینه‌ها</p>
				<p class="mt-0.5 text-sm font-semibold">{formatToman(accounting.summary.totalExpected)}</p>
			</div>
			<div class="rounded-xl bg-muted/40 px-3 py-2">
				<p class="text-[11px] text-muted-foreground">بدهی باز</p>
				<p
					class="mt-0.5 text-sm font-semibold {accounting.summary.unpaidCount > 0
						? 'text-amber-700 dark:text-amber-300'
						: 'text-muted-foreground'}"
				>
					{accounting.summary.unpaidCount.toLocaleString('fa-IR')} مورد
				</p>
			</div>
			{#if accounting.summary.totalWaived > 0}
				<div class="col-span-2 rounded-xl bg-muted/40 px-3 py-2 sm:col-span-4">
					<p class="text-[11px] text-muted-foreground">جمع بخشودگی ثبت‌شده</p>
					<p class="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
						{formatToman(accounting.summary.totalWaived)}
					</p>
				</div>
			{/if}
		</div>

		{#if saveSuccess}
			<p class="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
				{saveSuccess}
			</p>
		{/if}

		{#if accounting.ledger.length === 0}
			<p class="py-6 text-center text-sm text-muted-foreground">ردیف مالی برای این مراجع یافت نشد.</p>
		{:else}
			<div class="hidden overflow-x-auto md:block">
				<div class="min-w-[680px]">
					<div
						class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] items-center gap-3 border-b border-border/40 bg-muted/30 px-3 py-2.5 text-[11px] font-medium text-muted-foreground sm:px-4"
					>
						<span>عنوان</span>
						<span>تاریخ</span>
						<span>مبلغ</span>
						<span>وضعیت</span>
						<span class="text-center">عملیات</span>
					</div>

					<div class="divide-y divide-border/40">
						{#each accounting.ledger as row (row.id)}
							<div
								class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] items-center gap-3 px-3 py-3 sm:px-4"
							>
								<p class="min-w-0 truncate text-sm font-medium">{row.title}</p>
								<p class="min-w-0 truncate text-sm text-muted-foreground">{formatDate(row.date)}</p>
								<LedgerAmountCell {row} />
								<span
									class="inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium {paymentStatusClass(
										row.status
									)}"
								>
									{PAYMENT_STATUS_LABELS[row.status]}
								</span>
								<div class="flex justify-center gap-1">
									{#if row.status !== 'paid' && row.status !== 'waived'}
										<Button
											size="sm"
											variant="outline"
											class="h-8 rounded-lg px-2.5 text-xs"
											disabled={saving}
											onclick={() => openPayment(row)}
										>
											<CreditCard class="me-1 h-3.5 w-3.5" />
											ثبت پرداخت
										</Button>
									{:else}
										<Button
											size="sm"
											variant="ghost"
											class="h-8 rounded-lg px-2.5 text-xs"
											disabled={saving}
											onclick={() => openPayment(row)}
										>
											ویرایش
										</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="space-y-2 md:hidden">
				{#each accounting.ledger as row (row.id)}
					<div class="rounded-xl border border-border/50 p-3">
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">{row.title}</p>
								<p class="mt-0.5 text-xs text-muted-foreground">{formatDate(row.date)}</p>
							</div>
							<span
								class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium {paymentStatusClass(
									row.status
								)}"
							>
								{PAYMENT_STATUS_LABELS[row.status]}
							</span>
						</div>
						<LedgerAmountCell {row} compact />
						{#if row.status !== 'paid' && row.status !== 'waived'}
							<Button
								size="sm"
								class="mt-2 h-8 w-full rounded-lg text-xs"
								disabled={saving}
								onclick={() => openPayment(row)}
							>
								ثبت پرداخت
							</Button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>

<Dialog bind:open={dialogOpen} class="max-w-md">
	{#if selectedRow}
		<div class="space-y-4">
			<div>
				<h2 class="text-lg font-semibold">ثبت پرداخت</h2>
				<p class="mt-1 text-sm text-muted-foreground">{selectedRow.title}</p>
			</div>

			<div class="space-y-3">
				<div>
					<label for="payment-mode" class="mb-1.5 block text-xs font-medium text-muted-foreground">
						نوع تسویه
					</label>
					<Select id="payment-mode" bind:value={paymentMode}>
						<option value="full">{PAYMENT_MODE_LABELS.full}</option>
						<option value="installment">{PAYMENT_MODE_LABELS.installment}</option>
						<option value="waived">{PAYMENT_MODE_LABELS.waived}</option>
					</Select>
				</div>

				<div class="rounded-xl bg-muted/40 px-3 py-2.5 text-sm">
					<p class="text-xs text-muted-foreground">مانده قابل پرداخت</p>
					<p class="mt-0.5 font-semibold">{formatToman(remainingDue)}</p>
					{#if selectedRow.paidAmount > 0}
						<p class="mt-1 text-[11px] text-muted-foreground">
							پرداخت‌شده قبلی: {formatToman(selectedRow.paidAmount)}
						</p>
					{/if}
					{#if selectedRow.waivedAmount > 0}
						<p class="mt-1 text-[11px] text-muted-foreground">
							بخشودگی قبلی: {formatToman(selectedRow.waivedAmount)}
						</p>
					{/if}
				</div>

				{#if paymentMode === 'installment'}
					<div>
						<label
							for="installment-count"
							class="mb-1.5 block text-xs font-medium text-muted-foreground"
						>
							تعداد اقساط (حداکثر ۳)
						</label>
						<Select id="installment-count" bind:value={installmentCount}>
							<option value="2">۲ قسط</option>
							<option value="3">۳ قسط</option>
						</Select>
					</div>

					<div>
						<label for="paid-amount" class="mb-1.5 block text-xs font-medium text-muted-foreground">
							مبلغ قسط اول (تومان)
						</label>
						<MoneyInput
							id="paid-amount"
							bind:value={paidAmount}
							placeholder="مثلاً 800,000"
							class="rounded-xl"
						/>
					</div>
				{:else if paymentMode === 'full'}
					<div>
						<label for="paid-amount-full" class="mb-1.5 block text-xs font-medium text-muted-foreground">
							مبلغ تسویه
						</label>
						<Input
							id="paid-amount-full"
							value={formatToman(remainingDue)}
							disabled
						/>
					</div>
				{:else}
					<div>
						<label for="waived-amount" class="mb-1.5 block text-xs font-medium text-muted-foreground">
							مبلغ بخشودگی (تومان)
						</label>
						<MoneyInput
							id="waived-amount"
							bind:value={waivedAmount}
							placeholder="مثلاً 200,000"
							class="rounded-xl"
						/>
					</div>
					{#if waivedAmount >= remainingDue && remainingDue > 0}
						<p class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
							کل مانده ({formatToman(remainingDue)}) بخشیده می‌شود.
						</p>
					{:else if waivedAmount > 0}
						<p class="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
							پس از این بخشودگی، مانده مراجع:
							<span class="font-semibold text-foreground">
								{formatToman(Math.max(0, remainingDue - waivedAmount))}
							</span>
						</p>
					{/if}
				{/if}

				{#if paymentMode === 'installment' && installmentPreview}
					<div class="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-sm">
						<p class="font-medium text-primary">پیش‌نمایش تقسیط</p>
						<p>
							قسط اول:
							<span class="font-semibold">{formatToman(installmentPreview.firstInstallment)}</span>
						</p>
						<p>
							باقیمانده:
							<span class="font-semibold">{formatToman(installmentPreview.leftAfterFirst)}</span>
						</p>
						{#if installmentPreview.remainingInstallments > 0}
							<p class="text-xs text-muted-foreground">
								پیشنهاد برای هر یک از {installmentPreview.remainingInstallments.toLocaleString('fa-IR')}
								قسط باقیمانده:
								<span class="font-medium text-foreground">
									{formatToman(installmentPreview.suggestedPerInstallment)}
								</span>
							</p>
						{/if}
					</div>
				{/if}

				{#if paymentMode !== 'waived'}
					<div>
						<label for="payment-method" class="mb-1.5 block text-xs font-medium text-muted-foreground">
							روش پرداخت
						</label>
						<Select id="payment-method" bind:value={method}>
							<option value="cash">{PAYMENT_METHOD_LABELS.cash}</option>
							<option value="card">{PAYMENT_METHOD_LABELS.card}</option>
							<option value="transfer">{PAYMENT_METHOD_LABELS.transfer}</option>
							<option value="other">{PAYMENT_METHOD_LABELS.other}</option>
						</Select>
					</div>
				{/if}

				<div>
					<label for="payment-notes" class="mb-1.5 block text-xs font-medium text-muted-foreground">
						یادداشت (اختیاری)
					</label>
					<Input id="payment-notes" bind:value={notes} placeholder="توضیح کوتاه..." />
				</div>
			</div>

			{#if saveError}
				<div
					class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
				>
					<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
					<p>{saveError}</p>
				</div>
			{/if}

			<div class="flex flex-wrap gap-2 pt-1">
				<Button variant="outline" class="flex-1 rounded-xl" onclick={() => (dialogOpen = false)}>
					انصراف
				</Button>
				<Button class="flex-1 rounded-xl" disabled={saving} onclick={submitPayment}>
					{saving ? 'در حال ذخیره...' : 'تأیید و ذخیره'}
				</Button>
			</div>
		</div>
	{/if}
</Dialog>
