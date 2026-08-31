<script lang="ts">
	import type { AuthUser } from '$lib/auth.svelte';
	import type { Component } from 'svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import { LoaderCircle } from '@lucide/svelte';

	let {
		open = $bindable(false),
		user,
		onBooked,
		sessionKey = 0
	}: {
		open?: boolean;
		user: NonNullable<AuthUser>;
		onBooked?: () => void | Promise<void>;
		sessionKey?: number;
	} = $props();

	const deskMode = $derived(user.role === 'secretary' || user.role === 'admin');

	type WizardComponent = Component<{
		user: NonNullable<AuthUser>;
		deskMode?: boolean;
		variant?: 'page' | 'modal';
		onSuccess?: () => void;
		onCancel?: () => void;
	}>;

	let Wizard = $state<WizardComponent | null>(null);
	let wizardLoading = $state(false);

	$effect(() => {
		if (!open || Wizard || wizardLoading) return;
		wizardLoading = true;
		void import('./booking-wizard.svelte')
			.then((m) => {
				Wizard = m.default;
			})
			.finally(() => {
				wizardLoading = false;
			});
	});

	function handleSuccess() {
		open = false;
		void onBooked?.();
	}
</script>

{#if open}
	<Dialog
		bind:open
		class="max-h-[min(90dvh,820px)] w-[min(56rem,calc(100vw-2rem))] max-w-4xl overflow-hidden p-0 sm:p-0"
	>
		{#if Wizard}
			{#key sessionKey}
				<Wizard
					{user}
					{deskMode}
					variant="modal"
					onSuccess={handleSuccess}
					onCancel={() => (open = false)}
				/>
			{/key}
		{:else}
			<div class="flex items-center justify-center gap-2 p-16 text-sm text-muted-foreground">
				<LoaderCircle class="h-5 w-5 animate-spin" />
				در حال آماده‌سازی فرم...
			</div>
		{/if}
	</Dialog>
{/if}
