<script lang="ts">
	import { goto } from '$app/navigation';
	import { CircleUserRound, X } from '@lucide/svelte';
	import Button from '$lib/components/ui/button.svelte';
	import {
		PROFILE_NAV_ANNOUNCEMENT_ID,
		dismissAnnouncement,
		getProfileNavAnnouncementCopy,
		isAnnouncementDismissed
	} from '$lib/announcements/profile-nav-update';

	let {
		role = null,
		onDismiss
	}: {
		role?: string | null;
		onDismiss?: () => void;
	} = $props();

	let ready = $state(false);
	let dismissed = $state(false);
	const copy = $derived(getProfileNavAnnouncementCopy(role));
	const visible = $derived(ready && !dismissed);

	$effect(() => {
		if (typeof window === 'undefined') return;
		dismissed = isAnnouncementDismissed(PROFILE_NAV_ANNOUNCEMENT_ID);
		ready = true;
	});

	function close() {
		dismissAnnouncement(PROFILE_NAV_ANNOUNCEMENT_ID);
		dismissed = true;
		onDismiss?.();
	}

	function openProfile() {
		close();
		goto('/dashboard/profile');
	}
</script>

{#if visible}
	<div
		class="mb-4 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-l from-primary/8 via-primary/4 to-transparent shadow-sm"
		role="status"
		aria-live="polite"
	>
		<div class="flex gap-3 p-4 sm:gap-4 sm:p-5">
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10"
				aria-hidden="true"
			>
				<CircleUserRound class="h-5 w-5" />
			</div>

			<div class="min-w-0 flex-1 space-y-2 text-right">
				<div class="flex items-start justify-between gap-2">
					<h2 class="text-sm font-semibold text-foreground sm:text-base">{copy.title}</h2>
					<button
						type="button"
						class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 ease-in-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						aria-label="بستن اعلان"
						onclick={close}
					>
						<X class="h-4 w-4" />
					</button>
				</div>

				<ul class="space-y-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
					{#each copy.lines as line (line)}
						<li class="flex gap-2">
							<span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary/60" aria-hidden="true"></span>
							<span>{line}</span>
						</li>
					{/each}
					{#if copy.settingsHint}
						<li class="flex gap-2">
							<span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary/60" aria-hidden="true"></span>
							<span>{copy.settingsHint}</span>
						</li>
					{/if}
				</ul>

				<div class="flex flex-wrap items-center gap-2 pt-1">
					<Button size="sm" class="h-8 rounded-xl px-3 text-xs" onclick={openProfile}>
						{copy.profileCta}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						class="h-8 rounded-xl px-3 text-xs text-muted-foreground"
						onclick={close}
					>
						متوجه شدم
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
