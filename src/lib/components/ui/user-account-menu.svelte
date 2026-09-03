<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { CircleUserRound, LogOut } from '@lucide/svelte';
	import Avatar from '$lib/components/ui/avatar.svelte';
	import { cn } from '$lib/utils';

	let {
		name = 'کاربر',
		email = '',
		roleLabel = '',
		avatarUrl = null,
		onProfile,
		onLogout,
		align = 'start',
		class: className = ''
	}: {
		name?: string;
		email?: string;
		roleLabel?: string;
		avatarUrl?: string | null;
		onProfile?: () => void;
		onLogout?: () => void;
		align?: 'start' | 'center' | 'end';
		class?: string;
	} = $props();

	let open = $state(false);
	let avatarBroken = $state(false);

	$effect(() => {
		avatarUrl;
		avatarBroken = false;
	});

	const initial = $derived(name.trim().charAt(0) || 'ه');
	const showImage = $derived(Boolean(avatarUrl) && !avatarBroken);

	const itemClass =
		'group flex cursor-pointer select-none items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium outline-none transition-all duration-200 ease-in-out data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground';

	const contentClass =
		'z-50 w-64 overflow-hidden rounded-2xl border border-border/70 bg-popover/95 text-popover-foreground shadow-xl shadow-primary/5 outline-none backdrop-blur-md origin-top transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:pointer-events-none data-[state=closed]:scale-[0.96] data-[state=closed]:opacity-0 data-[state=closed]:-translate-y-1 data-[state=open]:scale-100 data-[state=open]:opacity-100 data-[state=open]:translate-y-0';
</script>

{#snippet avatarContent(sizeClass = 'text-sm')}
	{#if showImage}
		<img
			src={avatarUrl}
			alt={name}
			class="h-full w-full object-cover"
			onerror={() => {
				avatarBroken = true;
			}}
		/>
	{:else}
		<div
			class={cn(
				'flex h-full w-full items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground',
				sizeClass
			)}
		>
			{initial}
		</div>
	{/if}
{/snippet}

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger
		class={cn(
			'inline-flex rounded-full transition-all duration-200 ease-in-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
			open && 'scale-[0.98] opacity-95',
			className
		)}
		aria-label="منوی حساب کاربری"
	>
		<Avatar
			class={cn(
				'size-10 cursor-pointer shadow-sm ring-2 ring-background transition-all duration-200 ease-in-out',
				open && 'ring-primary/25 shadow-md'
			)}
		>
			{@render avatarContent('text-sm')}
		</Avatar>
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content {align} sideOffset={10} class={contentClass}>
			<div class="border-b border-border/50 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent px-4 py-3.5">
				<div class="flex items-center gap-3">
					<div class="relative shrink-0">
						<Avatar class="size-11 shadow-sm ring-2 ring-background">
							{@render avatarContent('text-sm')}
						</Avatar>
						<span
							class="absolute -bottom-0.5 -start-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-popover"
							aria-hidden="true"
						></span>
					</div>
					<div class="min-w-0 flex-1 text-right">
						<p class="truncate text-sm font-semibold text-popover-foreground">{name}</p>
						{#if email}
							<p class="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">{email}</p>
						{:else if roleLabel}
							<p class="mt-0.5 truncate text-xs text-muted-foreground">{roleLabel}</p>
						{/if}
					</div>
				</div>
			</div>

			<div class="space-y-1 p-2">
				<DropdownMenu.Item class={itemClass} onSelect={() => onProfile?.()}>
					<span
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10 transition-transform duration-200 group-data-[highlighted]:scale-105"
					>
						<CircleUserRound class="h-4 w-4" />
					</span>
					<span class="min-w-0 flex-1 text-right">پروفایل</span>
				</DropdownMenu.Item>

				<DropdownMenu.Separator class="my-1 h-px bg-border/60" />

				<DropdownMenu.Item
					class={cn(
						itemClass,
						'text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive'
					)}
					onSelect={() => onLogout?.()}
				>
					<span
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/10 transition-transform duration-200 group-data-[highlighted]:scale-105"
					>
						<LogOut class="h-4 w-4" />
					</span>
					<span class="min-w-0 flex-1 text-right">خروج</span>
				</DropdownMenu.Item>
			</div>
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
