<script lang="ts">
	import InfiniteMovingCards from './infinite-moving-cards.svelte';

	let {
		items,
		compact = false
	}: {
		items: { quote: string; name: string; title: string }[];
		compact?: boolean;
	} = $props();
</script>

<div class="relative flex w-full flex-col items-center justify-center overflow-hidden antialiased">
	<InfiniteMovingCards {items} {compact} direction="right" speed="slow" class="max-w-none" />
</div>
