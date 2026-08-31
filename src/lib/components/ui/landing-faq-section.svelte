<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	const faqs = [
		{
			q: 'هومبان چه خدماتی ارائه می‌دهد؟',
			a: 'روان‌درمانی، روانکاوی، مشاوره خانواده، نوروفیدبک، RTMS، TDCS و تست‌های روانشناسی.'
		},
		{
			q: 'چطور نوبت بگیرم؟',
			a: 'از دکمه «رزرو نوبت» در سایت وارد شوید، متخصص و زمان را انتخاب کنید.'
		},
		{
			q: 'آیا جلسات آنلاین هم دارید؟',
			a: 'بله، بسته به نوع درمان و نظر متخصص، امکان مشاوره آنلاین وجود دارد.'
		},
		{
			q: 'اطلاعات پرونده من محرمانه می‌ماند؟',
			a: 'بله. دسترسی به یادداشت‌های بالینی محدود به متخصص درمان و نقش‌های مجاز است.'
		}
	];

	let openIndex = $state<number | null>(0);

	function toggle(i: number) {
		openIndex = openIndex === i ? null : i;
	}
</script>

<section id="faq" class="bg-white px-4 py-20 dark:bg-background sm:px-6 sm:py-24">
	<div class="mx-auto max-w-3xl">
		<div class="mb-10 text-center">
			<h2 class="text-2xl font-bold tracking-tight sm:text-4xl">سوالات متداول</h2>
			<p class="mt-3 text-sm text-muted-foreground">پاسخ کوتاه به پرسش‌های رایج</p>
		</div>

		<div class="space-y-3">
			{#each faqs as faq, i (faq.q)}
				<div class="overflow-hidden rounded-2xl border border-border/60 bg-card/80">
					<button
						type="button"
						class="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-semibold transition-colors duration-200 hover:bg-muted/40 sm:text-base"
						aria-expanded={openIndex === i}
						onclick={() => toggle(i)}
					>
						<span>{faq.q}</span>
						<ChevronDown
							class={cn(
								'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
								openIndex === i && 'rotate-180'
							)}
							aria-hidden="true"
						/>
					</button>
					{#if openIndex === i}
						<div class="border-t border-border/50 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
							{faq.a}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
