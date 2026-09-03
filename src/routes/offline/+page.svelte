<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { WifiOff } from '@lucide/svelte';
	import { t } from '$lib/i18n';

	let locale = $derived($page.data.locale ?? 'fa');
</script>

<svelte:head>
	<title>{t(locale, 'offline.title')}</title>
</svelte:head>

<div class="flex min-h-[70vh] items-center justify-center px-4">
	<Card class="w-full max-w-md rounded-2xl shadow-sm">
		<CardHeader class="items-center space-y-3 text-center">
			<div class="rounded-full bg-muted p-3">
				<WifiOff class="h-8 w-8 text-muted-foreground" />
			</div>
			<CardTitle>{t(locale, 'offline.title')}</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4 text-center">
			<p class="text-sm text-muted-foreground">{t(locale, 'offline.body')}</p>
			<Button class="h-11 w-full rounded-xl" onclick={() => location.reload()}>
				{t(locale, 'offline.retry')}
			</Button>
		</CardContent>
	</Card>
</div>
