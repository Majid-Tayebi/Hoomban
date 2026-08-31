<script lang="ts">
	import { Lock, Shield, UserCheck } from '@lucide/svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	const items = [
		{
			icon: Lock,
			title: 'محرمانگی در اولویت',
			body: 'یادداشت‌های بالینی و پرونده درمانی با دسترسی محدود نگهداری می‌شوند.'
		},
		{
			icon: Shield,
			title: 'درمان مبتنی بر علم',
			body: 'از روانکاوی تا نوروتراپی — هر مسیر درمان بر پایه ارزیابی دقیق طراحی می‌شود.'
		},
		{
			icon: UserCheck,
			title: 'تیم متخصص و همدل',
			body: 'روانشناسان با تجربه بالینی که فرآیند درمان را شفاف و قابل پیگیری می‌کنند.'
		}
	];
</script>

<section
	id="trust"
	class="border-y border-border bg-white px-4 py-20 dark:bg-background sm:px-6 sm:py-24"
>
	<div class="mx-auto max-w-3xl text-center">
		<h2 class="text-2xl font-bold text-foreground sm:text-4xl">خصوصی، علمی، در کنار شما</h2>
		<p class="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
			درمان روان‌تنی نیاز به اعتماد دارد. هومبان با حفظ حریم خصوصی و شفافیت درمانی، فضایی
			امن برای شروع مسیر بهبود فراهم می‌کند.
		</p>
	</div>

	<div class="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
		{#each items as item (item.title)}
			<Card
				class="border-border/60 bg-card/80 text-card-foreground shadow-none transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-sm"
			>
				<CardTitle class="flex flex-row items-center gap-3 px-5 pt-5 text-base font-semibold">
					<span
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-cerulean-300"
					>
						<item.icon class="h-5 w-5" aria-hidden="true" />
					</span>
					{item.title}
				</CardTitle>
				<CardContent class="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
					{item.body}
				</CardContent>
			</Card>
		{/each}
	</div>
</section>
