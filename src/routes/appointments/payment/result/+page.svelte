<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button.svelte';
	import { CheckCircle2, XCircle } from '@lucide/svelte';

	const status = $derived($page.url.searchParams.get('status') || 'failed');
	const message = $derived($page.url.searchParams.get('message') || '');
	const refId = $derived($page.url.searchParams.get('ref') || '');
	const success = $derived(status === 'success');
</script>

<svelte:head>
	<title>{success ? 'پرداخت موفق' : 'پرداخت ناموفق'} | هومبان</title>
</svelte:head>

<div class="mx-auto flex min-h-[60dvh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
	{#if success}
		<CheckCircle2 class="mb-4 h-16 w-16 text-emerald-500" aria-hidden="true" />
		<h1 class="text-2xl font-bold">پرداخت موفق بود</h1>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			{message || 'نوبت شما با موفقیت ثبت شد.'}
		</p>
		{#if refId}
			<p class="mt-2 text-xs text-muted-foreground" dir="ltr">کد پیگیری: {refId}</p>
		{/if}
	{:else}
		<XCircle class="mb-4 h-16 w-16 text-destructive" aria-hidden="true" />
		<h1 class="text-2xl font-bold">پرداخت انجام نشد</h1>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			{message || 'در صورت کسر وجه، طی ۷۲ ساعت به حساب شما بازمی‌گردد.'}
		</p>
	{/if}

	<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
		<Button class="rounded-xl" onclick={() => goto('/dashboard/appointments')}>نوبت‌های من</Button>
		<Button variant="outline" class="rounded-xl" onclick={() => goto('/appointments/book')}>
			رزرو دوباره
		</Button>
	</div>
</div>
