<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		class: className = '',
		checked = $bindable(false),
		...restProps
	}: {
		class?: string;
		checked?: boolean;
		[key: string]: unknown;
	} = $props();
</script>

<input
	type="checkbox"
	bind:checked
	class={cn('h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary', className)}
	{...restProps}
/>
