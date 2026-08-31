<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setSidebarContext } from './sidebar-context.svelte';

	interface Props {
		open?: boolean;
		expanded?: boolean;
		animate?: boolean;
		children: Snippet;
	}

	let {
		open = $bindable(false),
		expanded = $bindable(true),
		animate = true,
		children
	}: Props = $props();

	setSidebarContext({
		get open() {
			return open;
		},
		setOpen(v) {
			open = typeof v === 'function' ? v(open) : v;
		},
		get expanded() {
			return expanded;
		},
		setExpanded(v) {
			expanded = typeof v === 'function' ? v(expanded) : v;
		},
		toggleExpanded() {
			expanded = !expanded;
		},
		get animate() {
			return animate;
		}
	});
</script>

{@render children()}
