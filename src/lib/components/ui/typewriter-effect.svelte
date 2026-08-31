<script lang="ts" module>
	export type TypewriterWord = {
		text: string;
		className?: string;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		words,
		class: className = '',
		cursorClassName = '',
		variant = 'smooth',
		rtl = true
	}: {
		words: TypewriterWord[];
		class?: string;
		cursorClassName?: string;
		variant?: 'smooth' | 'classic';
		rtl?: boolean;
	} = $props();

	let root = $state<HTMLElement | null>(null);
	let inView = $state(false);
	let visibleCount = $state(0);

	const flatChars = $derived(
		words.flatMap((word, wordIndex) =>
			[...word.text].map((char, charIndex) => ({
				char,
				className: word.className,
				key: `${wordIndex}-${charIndex}`
			}))
		)
	);

	const totalChars = $derived(flatChars.length);

	$effect(() => {
		if (!root) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) inView = true;
			},
			{ threshold: 0.35 }
		);

		observer.observe(root);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (variant !== 'classic' || !inView) return;

		visibleCount = 0;
		const timer = window.setInterval(() => {
			visibleCount += 1;
			if (visibleCount >= totalChars) window.clearInterval(timer);
		}, 80);

		return () => window.clearInterval(timer);
	});
</script>

{#if variant === 'smooth'}
	<div bind:this={root} class={cn('my-4 flex items-end gap-1', rtl && 'flex-row-reverse', className)}>
		<div
			class={cn(
				'overflow-hidden pb-1',
				inView && (rtl ? 'animate-typewriter-reveal-rtl' : 'animate-typewriter-reveal')
			)}
		>
			<div
				class="whitespace-nowrap text-xl font-bold text-foreground sm:text-2xl md:text-3xl lg:text-4xl"
			>
				{#each words as word, idx (idx)}
					<span class={cn('inline-block', word.className)}>
						{word.text}
					</span>
					{#if idx < words.length - 1}
						<span>&nbsp;</span>
					{/if}
				{/each}
			</div>
		</div>
		<span
			class={cn(
				'mb-1 block h-5 w-[3px] shrink-0 rounded-sm bg-primary sm:h-7 md:h-9 lg:h-10',
				inView && 'animate-typewriter-cursor',
				cursorClassName
			)}
			aria-hidden="true"
		></span>
	</div>
{:else}
	<div
		bind:this={root}
		class={cn(
			'text-center text-xl font-bold text-foreground sm:text-2xl md:text-3xl lg:text-5xl',
			className
		)}
	>
		<span class="inline">
			{#each flatChars as item, index (item.key)}
				<span
					class={cn(
						'inline-block',
						index < visibleCount ? 'opacity-100' : 'hidden opacity-0',
						item.className
					)}
				>
					{item.char}
				</span>
			{/each}
		</span>
		<span
			class={cn(
				'ms-1 inline-block h-4 w-[3px] rounded-sm bg-primary sm:h-6 md:h-8 lg:h-10',
				inView && 'animate-typewriter-cursor',
				cursorClassName
			)}
			aria-hidden="true"
		></span>
	</div>
{/if}
