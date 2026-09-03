<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser, clearAuth, isAuthHydrated, refreshAuthUser } from '$lib/auth.svelte';
	import { formatFaDate } from '$lib/date';
	import { globalSearch } from '$lib/search.svelte';
	import ToggleTheme from '$lib/components/ui/toggle-theme.svelte';
	import UserAccountMenu from '$lib/components/ui/user-account-menu.svelte';
	import GlobalSearchPanel from '$lib/components/global-search-panel.svelte';
	import DashboardUpdateBanner from '$lib/components/dashboard-update-banner.svelte';
	import NotificationBell from '$lib/components/notification-bell.svelte';
	import NotificationToastStack from '$lib/components/notification-toast-stack.svelte';
	import SidebarBody from '$lib/components/ui/sidebar-body.svelte';
	import AppSidebar, { type AppNavGroup } from '$lib/components/app-sidebar.svelte';
	import {
		Menu,
		Search
	} from '@lucide/svelte';
	import {
		bindNotifications,
		bindServiceWorkerPush,
		stopNotifications
	} from '$lib/notifications/notifications.svelte';
	import { initPushForUser } from '$lib/push/push.svelte';
	import PushEnablePrompt from '$lib/push/components/push-enable-prompt.svelte';
	import { pb } from '$lib/pocketbase';
	import type { AuthUser } from '$lib/auth.svelte';
	import { browser } from '$app/environment';

	let {
		children,
		/** SSR session user when client PocketBase auth is not yet hydrated (E2E cookie login). */
		fallbackUser = null as AuthUser
	} = $props();

	let user = $derived.by(() => {
		const client = getUser();
		const base = client ?? fallbackUser;
		if (!base) return null;
		if (client?.avatarUrl || !fallbackUser?.avatarUrl) return base;
		return { ...base, avatarUrl: fallbackUser.avatarUrl };
	});
	let hydrated = $derived(isAuthHydrated());
	let clientActive = $state(false);
	$effect(() => {
		if (browser) clientActive = true;
	});
	const shellReady = $derived(Boolean(fallbackUser) || hydrated || clientActive);
	let sidebarOpen = $state(false);
	const todayLabel = $derived(formatFaDate(new Date()));

	$effect(() => {
		if (!hydrated) return;
		if (!user) goto('/auth');
	});

	$effect(() => {
		if (!hydrated || !user?.id || user.id === 'demo-user' || user.avatarUrl) return;
		if (!pb.authStore.isValid) return;
		void refreshAuthUser();
	});

	$effect(() => {
		if (!hydrated || !user?.id || user.id === 'demo-user') return;
		if (!pb.authStore.isValid) return;
		const timer = setTimeout(() => {
			bindNotifications(user.id);
			void initPushForUser(user.id);
		}, 800);
		const unbindPush = bindServiceWorkerPush();
		return () => {
			clearTimeout(timer);
			unbindPush();
			stopNotifications();
		};
	});

	function logout() {
		clearAuth();
		goto('/auth');
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
			event.preventDefault();
			globalSearch.openPanel();
		}
		if (globalSearch.open && event.key === 'Escape') {
			globalSearch.close();
		}
	}

	function getRoleLabel(role: string) {
		const labels: Record<string, string> = {
			admin: 'مدیر',
			doctor: 'روانشناس',
			secretary: 'منشی',
			patient: 'مراجع',
			writer: 'نویسنده'
		};
		return labels[role] ?? 'کاربر';
	}

	/** Groups match shadcn Sidebar.MenuSub screenshot: label + indented links. */
	const navGroups = $derived.by((): AppNavGroup[] => {
		const role = user?.role;

		if (role === 'admin') {
			return [
				{
					label: 'شروع',
					items: [{ title: 'داشبورد', href: '/dashboard' }]
				},
				{
					label: 'مدیریت',
					items: [
						{ title: 'مراجعان', href: '/dashboard/patients' },
						{ title: 'همکاران', href: '/dashboard/admin/staff' }
					]
				}
			];
		}

		if (role === 'secretary') {
			return [
				{
					label: 'شروع',
					items: [{ title: 'داشبورد', href: '/dashboard' }]
				},
				{
					label: 'عملیات کلینیک',
					items: [
						{ title: 'نوبت‌ها', href: '/dashboard/appointments' },
						{ title: 'تقویم', href: '/dashboard/calendar' },
						{ title: 'حسابداری', href: '/dashboard/desk/accounting' },
						{ title: 'متخصصین', href: '/dashboard/doctors' },
						{ title: 'خدمات', href: '/dashboard/services' }
					]
				}
			];
		}

		if (role === 'doctor') {
			return [
				{
					label: 'شروع',
					items: [{ title: 'داشبورد', href: '/dashboard/appointments' }]
				},
				{
					label: 'کار من',
					items: [
						{ title: 'مراجعان', href: '/dashboard/patients' },
						{ title: 'ساعات کاری', href: '/dashboard/schedule' }
					]
				}
			];
		}

		if (role === 'writer') {
			return [
				{
					label: 'شروع',
					items: [{ title: 'داشبورد', href: '/dashboard' }]
				},
				{
					label: 'محتوا',
					items: [
						{ title: 'مقالات', href: '/dashboard/articles' },
						{ title: 'آزمون‌ها', href: '/dashboard/tests' },
						{ title: 'تست‌های عمومی', href: '/tests' }
					]
				}
			];
		}

		return [
			{
				label: 'شروع',
				items: [
					{ title: 'داشبورد', href: '/dashboard' },
					{ title: 'نوبت‌های من', href: '/dashboard/appointments' },
					{ title: 'رزرو نوبت', href: '/appointments/book' },
					{ title: 'تست‌های روانشناسی', href: '/tests' }
				]
			}
		];
	});

	function navigate(path: string) {
		goto(path);
	}
</script>

<svelte:window onkeydown={handleSearchKeydown} />

{#if !shellReady}
	<div class="flex min-h-dvh items-center justify-center bg-background">
		<p class="text-sm text-muted-foreground">در حال بارگذاری...</p>
	</div>
{:else if user}
	<div class="min-h-dvh bg-background" data-testid="app-shell-ready">
		<div class="flex min-h-dvh flex-col md:mr-52">
			<header
				class="safe-top relative sticky top-0 z-20 flex h-14 items-center gap-2 bg-background/70 px-3 backdrop-blur-xl print:hidden sm:gap-3 sm:px-5 xl:h-16 xl:px-6"
			>
				<button
					type="button"
					class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground md:hidden"
					aria-label="منو"
					onclick={() => (sidebarOpen = true)}
				>
					<Menu class="h-5 w-5" />
				</button>

				<div class="flex-1" aria-hidden="true"></div>

				<div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
					<span class="hidden text-xs text-muted-foreground tabular-nums whitespace-nowrap sm:inline sm:text-sm">
						{todayLabel}
					</span>
					<ToggleTheme />
					<button
						type="button"
						class="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
						aria-label="جستجو در پنل"
						title="جستجو (Ctrl+K)"
						onclick={() => globalSearch.openPanel()}
					>
						<Search class="h-[18px] w-[18px]" />
					</button>
					<NotificationBell />

					<UserAccountMenu
						name={user.name || 'کاربر'}
						email={user.email || ''}
						roleLabel={getRoleLabel(user.role ?? '')}
						avatarUrl={user.avatarUrl ?? null}
						onProfile={() => navigate('/dashboard/profile')}
						onLogout={logout}
					/>
				</div>
			</header>

			<GlobalSearchPanel />

			<main
				class="safe-bottom mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 print:p-0 sm:px-5 sm:py-5 xl:px-6 xl:py-6"
			>
				<div class="print:hidden">
					<DashboardUpdateBanner role={user.role ?? null} />
				</div>
				{@render children()}
			</main>
		</div>

		<SidebarBody open={sidebarOpen} onClose={() => (sidebarOpen = false)}>
			<AppSidebar groups={navGroups} onNavigate={() => (sidebarOpen = false)} />
		</SidebarBody>

		<PushEnablePrompt />

		<NotificationToastStack />
	</div>
{:else}
	<div class="min-h-dvh bg-background" data-testid="app-shell-guest">
		{@render children()}
	</div>
{/if}
