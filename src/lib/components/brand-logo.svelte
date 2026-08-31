<script lang="ts">
	import { cn } from '$lib/utils';
	import { HOOMBAN_LOGO_PNG_192, HOOMBAN_LOGO_WEBP_72 } from '$lib/brand/logo';

	let {
		class: className = 'h-9 w-9 object-contain',
		width = 72,
		height = 72,
		priority = false
	}: {
		class?: string;
		width?: number;
		height?: number;
		/** Above-the-fold logo (navbar) */
		priority?: boolean;
	} = $props();
</script>

<picture>
	<source srcset={HOOMBAN_LOGO_WEBP_72} type="image/webp" />
	<img
		src={HOOMBAN_LOGO_PNG_192}
		alt=""
		class={cn('shrink-0', className)}
		{width}
		{height}
		decoding="async"
		loading={priority ? 'eager' : 'lazy'}
		fetchpriority={priority ? 'high' : 'auto'}
	/>
</picture>
