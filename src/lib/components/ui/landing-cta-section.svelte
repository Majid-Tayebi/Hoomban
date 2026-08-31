<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
</script>

<section
	class="relative overflow-hidden bg-white px-4 py-20 dark:bg-background sm:px-6 sm:py-24"
>
	<div
		class="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_50%_100%,hsl(var(--primary)/0.18),transparent_55%)]"
	></div>

	<div class="relative mx-auto max-w-3xl text-center">
		<h2 class="text-2xl font-bold text-foreground sm:text-4xl">امروز اولین قدم را بردارید</h2>
		<p class="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
			تیم هومبان آماده است تا مسیر درمان را با شما طراحی کند.
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			<a
				href="/appointments/book"
				class="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
			>
				رزرو نوبت
				<ArrowLeft class="h-4 w-4" aria-hidden="true" />
			</a>
			<a
				href="/auth"
				class="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-200 hover:bg-accent dark:bg-background/40"
			>
				ورود
			</a>
		</div>
	</div>
</section>
