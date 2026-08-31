<script lang="ts">
	import { getUser } from '$lib/auth.svelte';
	import CalendarBoard from '$lib/calendar/components/calendar-board.svelte';

	let user = $derived(getUser());
</script>

{#if user}
	<CalendarBoard {user} />
{/if}
