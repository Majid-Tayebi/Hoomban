<script lang="ts" module>
	export interface TeamMember {
		id: string;
		name: string;
		role: string;
		image: string;
		social?: {
			twitter?: string;
			linkedin?: string;
			instagram?: string;
			behance?: string;
		};
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import TeamShowcaseMobile from '$lib/components/ui/team-showcase-mobile.svelte';
	import { resolveDefaultLandingDoctorId } from '$lib/landing/public-data';

	let {
		members = []
	}: {
		members?: TeamMember[];
	} = $props();

	const defaultId = $derived(resolveDefaultLandingDoctorId(members));
	let hoveredId = $state<string | null>(null);
	const activeId = $derived(hoveredId ?? defaultId);

	function setHovered(id: string | null) {
		hoveredId = id;
	}

	function resetToDefault() {
		hoveredId = null;
	}

	function memberInitial(name: string) {
		return name.trim().charAt(0) || '؟';
	}

	function handleMosaicPointerMove(e: PointerEvent) {
		const target = document.elementFromPoint(e.clientX, e.clientY);
		const card = target?.closest<HTMLElement>('[data-member-id]');
		setHovered(card?.dataset.memberId ?? null);
	}

	const col1 = $derived(members.filter((_, i) => i % 3 === 0));
	const col2 = $derived(members.filter((_, i) => i % 3 === 1));
	const col3 = $derived(members.filter((_, i) => i % 3 === 2));
</script>

{#snippet photoCard(member: TeamMember, className: string)}
	{@const isActive = activeId === member.id}
	{@const isDimmed = activeId !== null && !isActive}
	<div
		data-member-id={member.id}
		class={cn(
			'relative flex-shrink-0 overflow-hidden rounded-xl transition-opacity duration-300',
			className,
			isDimmed ? 'opacity-60' : 'opacity-100'
		)}
		aria-label={`${member.name}، ${member.role}`}
		onpointerenter={() => setHovered(member.id)}
	>
		{#if member.image}
			<img
				src={member.image}
				alt=""
				class={cn(
					'h-full w-full object-cover object-top transition-[filter] duration-500',
					isActive ? 'grayscale-0 brightness-100' : 'grayscale brightness-[0.77]'
				)}
			/>
		{:else}
			<div
				class={cn(
					'flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/80 to-muted text-xl font-bold transition-[filter] duration-500',
					isActive ? 'grayscale-0 brightness-100' : 'grayscale brightness-[0.77]'
				)}
			>
				{memberInitial(member.name)}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet memberRow(member: TeamMember)}
	{@const isActive = activeId === member.id}
	{@const isDimmed = activeId !== null && !isActive}
	{@const hasSocial =
		member.social?.twitter ||
		member.social?.linkedin ||
		member.social?.instagram ||
		member.social?.behance}
	<div
		role="button"
		tabindex="0"
		class={cn(
			'cursor-pointer transition-opacity duration-300',
			isDimmed ? 'opacity-50' : 'opacity-100'
		)}
		onmouseenter={() => setHovered(member.id)}
		onmouseleave={resetToDefault}
		onfocus={() => setHovered(member.id)}
		onblur={resetToDefault}
	>
		<div class="flex items-center gap-2.5">
			<span
				class={cn(
					'h-3 w-4 flex-shrink-0 rounded-[5px] transition-all duration-300',
					isActive ? 'w-5 bg-foreground' : 'bg-foreground/25'
				)}
			></span>
			<span
				class={cn(
					'text-base font-semibold leading-none tracking-tight transition-colors duration-300 md:text-[18px]',
					isActive ? 'text-foreground' : 'text-foreground/80'
				)}
			>
				{member.name}
			</span>

			{#if hasSocial}
				<div
					class={cn(
						'mr-0.5 flex items-center gap-1.5 transition-all duration-200',
						isActive
							? 'translate-x-0 opacity-100'
							: 'pointer-events-none translate-x-2 opacity-0'
					)}
				>
					{#if member.social?.linkedin}
						<a
							href={member.social.linkedin}
							target="_blank"
							rel="noopener noreferrer"
							onclick={(e) => e.stopPropagation()}
							class="rounded p-1 text-muted-foreground transition-all duration-150 hover:scale-110 hover:bg-foreground/10 hover:text-foreground"
							title="LinkedIn"
							aria-label="LinkedIn {member.name}"
						>
							<svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path
									d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
								/>
							</svg>
						</a>
					{/if}
					{#if member.social?.instagram}
						<a
							href={member.social.instagram}
							target="_blank"
							rel="noopener noreferrer"
							onclick={(e) => e.stopPropagation()}
							class="rounded p-1 text-muted-foreground transition-all duration-150 hover:scale-110 hover:bg-foreground/10 hover:text-foreground"
							title="Instagram"
							aria-label="Instagram {member.name}"
						>
							<svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path
									d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
								/>
							</svg>
						</a>
					{/if}
					{#if member.social?.twitter}
						<a
							href={member.social.twitter}
							target="_blank"
							rel="noopener noreferrer"
							onclick={(e) => e.stopPropagation()}
							class="rounded p-1 text-muted-foreground transition-all duration-150 hover:scale-110 hover:bg-foreground/10 hover:text-foreground"
							title="X"
							aria-label="X {member.name}"
						>
							<svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path
									d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"
								/>
							</svg>
						</a>
					{/if}
				</div>
			{/if}
		</div>

		<p
			class="mt-1.5 pr-[27px] text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:text-[11px]"
		>
			{member.role}
		</p>
	</div>
{/snippet}

{#if members.length}
	<!-- Mobile: grid + sticky tap selection -->
	<div class="md:hidden">
		<TeamShowcaseMobile {members} />
	</div>

	<!-- Desktop: mosaic + hover + name list -->
	<div
		class="mx-auto hidden w-full max-w-5xl select-none flex-col items-center gap-8 px-2 py-4 font-sans md:flex md:flex-row md:items-start md:gap-10 md:px-4 lg:gap-14"
		dir="rtl"
	>
		<div
			class="flex flex-shrink-0 gap-3"
			onpointermove={handleMosaicPointerMove}
			onpointerleave={resetToDefault}
			onpointercancel={resetToDefault}
		>
			<div class="flex flex-col gap-3">
				{#each col1 as member (member.id)}
					{@render photoCard(member, 'h-[165px] w-[155px]')}
				{/each}
			</div>

			<div class="mt-[68px] flex flex-col gap-3">
				{#each col2 as member (member.id)}
					{@render photoCard(member, 'h-[182px] w-[172px]')}
				{/each}
			</div>

			<div class="mt-[32px] flex flex-col gap-3">
				{#each col3 as member (member.id)}
					{@render photoCard(member, 'h-[172px] w-[162px]')}
				{/each}
			</div>
		</div>

		<div class="flex w-full flex-1 flex-col gap-5 pt-2">
			{#each members as member (member.id)}
				{@render memberRow(member)}
			{/each}
		</div>
	</div>
{/if}
