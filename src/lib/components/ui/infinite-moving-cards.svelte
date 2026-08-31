<script lang="ts">
	import { cn } from '$lib/utils';

	type Item = {
		quote: string;
		name: string;
		title: string;
	};

	let {
		items,
		direction = 'left',
		speed = 'fast',
		pauseOnHover = true,
		compact = false,
		class: className = ''
	}: {
		items: Item[];
		direction?: 'left' | 'right';
		speed?: 'fast' | 'normal' | 'slow';
		pauseOnHover?: boolean;
		compact?: boolean;
		class?: string;
	} = $props();

	const duplicatedItems = $derived([...items, ...items]);

	const durationClass = $derived(
		speed === 'fast'
			? '[animation-duration:20s]'
			: speed === 'normal'
				? '[animation-duration:40s]'
				: '[animation-duration:55s]'
	);
</script>

<div
	dir="ltr"
	class={cn(
		'scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]',
		className
	)}
>
	<ul
		class={cn(
			'flex w-max min-w-full shrink-0 flex-nowrap gap-4 animate-scroll',
			compact ? 'py-1' : 'py-4',
			durationClass,
			direction === 'right' && '[animation-direction:reverse]',
			pauseOnHover && 'hover:[animation-play-state:paused]'
		)}
	>
		{#each duplicatedItems as item, idx (`${item.name}-${idx}`)}
			<li
				class={cn(
					'relative max-w-full shrink-0 rounded-2xl border border-b-0 border-zinc-200 bg-[linear-gradient(180deg,#fafafa,#f5f5f5)] dark:border-zinc-700 dark:bg-[linear-gradient(180deg,#27272a,#18181b)]',
					compact ? 'w-[300px] px-5 py-4 md:w-[380px]' : 'w-[350px] px-8 py-6 md:w-[450px]'
				)}
			>
				<blockquote dir="rtl">
					<div
						aria-hidden="true"
						class="pointer-events-none absolute -left-0.5 -top-0.5 -z-[1] h-[calc(100%_+_4px)] w-[calc(100%_+_4px)] select-none"
					></div>
					<span
						class="relative z-20 text-sm font-normal leading-[1.6] text-neutral-800 dark:text-gray-100"
					>
						{item.quote}
					</span>
					<div class={cn('relative z-20 flex flex-row items-center', compact ? 'mt-3' : 'mt-6')}>
						<span class="flex flex-col gap-1">
							<span
								class="text-sm font-normal leading-[1.6] text-neutral-500 dark:text-gray-400"
							>
								{item.name}
							</span>
							<span
								class="text-sm font-normal leading-[1.6] text-neutral-500 dark:text-gray-400"
							>
								{item.title}
							</span>
						</span>
					</div>
				</blockquote>
			</li>
		{/each}
	</ul>
</div>
