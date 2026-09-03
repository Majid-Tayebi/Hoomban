<script lang="ts">
	import Avatar from '$lib/components/ui/avatar.svelte';
	import { cn } from '$lib/utils';
	import PushSettingsPanel from '$lib/push/components/push-settings-panel.svelte';
	import { Lock, MapPin, Pencil, UserRound } from '@lucide/svelte';

	export type ProfileTab = 'details' | 'address' | 'password';

	let {
		displayAvatar = null,
		initial,
		firstName,
		lastName,
		usernameDisplay,
		roleLabel,
		avatarAlt = 'پروفایل',
		activeTab,
		showPushSettings = false,
		onAvatarPick,
		onSelectTab
	}: {
		displayAvatar?: string | null;
		initial: string;
		firstName: string;
		lastName: string;
		usernameDisplay: string;
		roleLabel: string;
		avatarAlt?: string;
		activeTab: ProfileTab;
		showPushSettings?: boolean;
		onAvatarPick: (event: Event) => void;
		onSelectTab: (tab: ProfileTab) => void;
	} = $props();

	let fileInput: HTMLInputElement | undefined = $state();
</script>

<aside class="border-b border-border/50 bg-muted/20 p-5 lg:border-b-0 lg:border-e">
	<div class="flex flex-col items-center text-center">
		<div class="relative">
			<Avatar class="size-24 shadow-md ring-4 ring-background">
				{#if displayAvatar}
					<img src={displayAvatar} alt={avatarAlt} class="h-full w-full object-cover" />
				{:else}
					<div
						class="flex h-full w-full items-center justify-center bg-primary text-2xl font-bold text-primary-foreground"
					>
						{initial}
					</div>
				{/if}
			</Avatar>
			<button
				type="button"
				class="absolute -bottom-1 -start-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform duration-200 hover:scale-105"
				aria-label="تغییر عکس پروفایل"
				onclick={() => fileInput?.click()}
			>
				<Pencil class="size-3.5" />
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept="image/jpeg,image/png,image/webp,image/gif"
				class="hidden"
				onchange={onAvatarPick}
			/>
		</div>

		<p class="mt-4 text-base font-semibold">{firstName} {lastName}</p>
		<p class="mt-0.5 font-mono text-xs text-muted-foreground" dir="ltr">{usernameDisplay}</p>
		<p class="mt-0.5 text-sm text-muted-foreground">{roleLabel}</p>
	</div>

	<nav class="mt-6 space-y-1">
		<button
			type="button"
			class={cn(
				'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
				activeTab === 'details'
					? 'bg-primary/10 text-primary'
					: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
			)}
			onclick={() => onSelectTab('details')}
		>
			<UserRound class="size-4 shrink-0" />
			<span>مشخصات</span>
		</button>
		<button
			type="button"
			class={cn(
				'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
				activeTab === 'address'
					? 'bg-primary/10 text-primary'
					: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
			)}
			onclick={() => onSelectTab('address')}
		>
			<MapPin class="size-4 shrink-0" />
			<span>آدرس</span>
		</button>
		<button
			type="button"
			class={cn(
				'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
				activeTab === 'password'
					? 'bg-primary/10 text-primary'
					: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
			)}
			onclick={() => onSelectTab('password')}
		>
			<Lock class="size-4 shrink-0" />
			<span>رمز عبور</span>
		</button>
	</nav>

	{#if showPushSettings}
		<div class="mt-6">
			<PushSettingsPanel />
		</div>
	{/if}
</aside>
