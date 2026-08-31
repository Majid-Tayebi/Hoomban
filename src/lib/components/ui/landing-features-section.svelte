<script lang="ts">
	import type { Component } from 'svelte';
	import {
		Activity,
		Brain,
		Cloud,
		GitBranch,
		Heart,
		HeartPulse,
		Magnet,
		MessageCircle,
		Sun,
		Zap
	} from '@lucide/svelte';
	import type { LandingService } from '$lib/landing/public-data';

	let { services = [] }: { services?: LandingService[] } = $props();

	const fallback: LandingService[] = [
		{
			id: '1',
			title: 'نقشه مغزی',
			description:
				'نقشه مغزی (QEEG) برای بررسی کمی فعالیت مغز و طراحی درمان شخصی‌سازی‌شده.',
			price: 0,
			category: 'نوروتراپی'
		},
		{
			id: '2',
			title: 'هر جلسه TDCS',
			description: 'تحریک الکتریکی مستقیم مغز (tDCS) — روش غیرتهاجمی نورومدولاسیون.',
			price: 0,
			category: 'نوروتراپی'
		},
		{
			id: '3',
			title: '۴۵ دقیقه مشاوره و روان‌درمانی',
			description: 'جلسه مشاوره و روان‌درمانی حضوری یا آنلاین.',
			price: 0,
			category: 'روان‌درمانی'
		},
		{
			id: '4',
			title: 'لورتا نوروفیدبک و بایوفیدبک',
			description: 'جلسه لورتا نوروفیدبک و بایوفیدبک برای تنظیم الگوهای فعالیت مغزی.',
			price: 0,
			category: 'نوروتراپی'
		},
		{
			id: '5',
			title: 'تحریک عصب واگ',
			description: 'تحریک غیرتهاجمی عصب واگ (tVNS/nVNS).',
			price: 0,
			category: 'نوروتراپی'
		},
		{
			id: '6',
			title: 'هر جلسه RTMS',
			description: 'تحریک مغناطیسی مکرر مغز (rTMS).',
			price: 0,
			category: 'نوروتراپی'
		},
		{
			id: '7',
			title: 'لیزر مغزی',
			description: 'فتوبیومادولیشن / لیزر درمانی کم‌توان مغز.',
			price: 0,
			category: 'نوروتراپی'
		},
		{
			id: '8',
			title: 'روان‌درمانی',
			description:
				'روان‌درمانی فرایندی تخصصی برای شناخت و تغییر الگوهای فکری، احساسی و رفتاری.',
			price: 0,
			category: 'خدمات اصلی'
		}
	];

	const items = $derived((services.length ? services : fallback).slice(0, 8));

	function getServiceIcon(title: string): typeof Brain {
		const normalized = title.replace(/\s+/g, ' ').trim();

		if (/qeeg|نقشه/i.test(normalized)) return Brain;
		if (/tdcs/i.test(normalized)) return Zap;
		if (/مشاوره|روان‌درمانی|رواندرمانی/i.test(normalized)) return MessageCircle;
		if (/نوروفیدبک|بایوفیدبک|لورتا/i.test(normalized)) return Activity;
		if (/واگ/i.test(normalized)) return HeartPulse;
		if (/rtms/i.test(normalized)) return Magnet;
		if (/لیزر|فتوبیو/i.test(normalized)) return Sun;
		if (/روانکاوی/i.test(normalized)) return GitBranch;
		if (/نوروتراپی/i.test(normalized)) return Cloud;

		return Heart;
	}
</script>

<section
	id="services"
	class="bg-white px-4 py-20 dark:bg-background sm:px-6 sm:py-24"
>
	<div class="mx-auto max-w-3xl text-center">
		<p class="mb-2 text-xs font-semibold tracking-wide text-primary sm:text-sm">خدمات</p>
		<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
			درمان‌های تخصصی هومبان
		</h2>
		<p class="mt-3 text-sm text-muted-foreground sm:text-base">
			از مشاوره تا نوروتراپی — مسیر درمان متناسب با نیاز شما
		</p>
	</div>

	<div class="mx-auto mt-12 max-w-7xl border-b border-e border-border">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
			{#each items as service (service.id)}
				{@const Icon = getServiceIcon(service.title) as Component}
				<div
					class="group/feature relative border-s border-t border-border p-8 transition-colors duration-200 hover:bg-accent/30 sm:p-10"
				>
					<div
						class="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 transition-opacity duration-200 group-hover/feature:opacity-100 dark:from-cerulean-400/10"
					></div>

					<div
						class="absolute inset-y-0 start-0 my-auto h-6 w-1 origin-center rounded-full bg-border transition-all duration-200 group-hover/feature:h-8 group-hover/feature:bg-primary dark:group-hover/feature:bg-cerulean-400"
					></div>

					<div class="relative z-10 flex flex-col gap-3 ps-4">
						<Icon
							class="size-5 text-muted-foreground transition-colors duration-200 group-hover/feature:text-primary dark:group-hover/feature:text-cerulean-300"
							strokeWidth={1.5}
							aria-hidden="true"
						/>
						<h3
							class="text-base font-bold text-foreground transition-transform duration-200 group-hover/feature:translate-x-[-0.25rem] sm:text-lg"
						>
							{service.title}
						</h3>
						<p class="max-w-xs text-sm leading-relaxed text-muted-foreground">
							{service.description || 'خدمت تخصصی کلینیک هومبان'}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
