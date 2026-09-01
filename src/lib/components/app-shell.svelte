<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
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
		LayoutDashboard,
		Calendar,
		ClipboardList,
		Users,
		Menu,
		CalendarDays,
		UserCog,
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

	let { children } = $props();

	let user = $derived(getUser());
	let hydrated = $derived(isAuthHydrated());
	let sidebarOpen = $state(false);
	let authAvatarSynced = $state(false);
	let pathname = $derived($page.url.pathname);
	const todayLabel = $derived(formatFaDate(new Date()));

	$effect(() => {
		if (!hydrated) return;
		if (!user) goto('/auth');
	});

	$effect(() => {
		const id = user?.id;
		if (!hydrated || !id || id === 'demo-user' || authAvatarSynced) return;
		authAvatarSynced = true;
		void refreshAuthUser();
	});

	$effect(() => {
		if (!hydrated || !user?.id || user.id === 'demo-user') return;
		if (!pb.authStore.isValid) return;
		bindNotifications(user.id);
		void initPushForUser(user.id);
		const unbindPush = bindServiceWorkerPush();
		return () => {
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

	const adminPrimary = [
		{ icon: LayoutDashboard, label: 'داشبورد', path: '/dashboard' },
		{ icon: Users, label: 'مراجعان', path: '/dashboard/patients' },
		{ icon: UserCog, label: 'همکاران', path: '/dashboard/admin/staff' }
	] as const;

	const primaryNav = $derived.by(() => {
		const role = user?.role;
		if (role === 'admin') {
			return adminPrimary.map((item) => ({
				icon: item.icon,
				label: item.label,
				path: item.path
			}));
		}
		if (role === 'secretary') {
			return [
				{ icon: LayoutDashboard, label: 'داشبورد', path: '/dashboard' },
				{ icon: CalendarDays, label: 'نوبت‌ها', path: '/dashboard/appointments' },
				{ icon: ClipboardList, label: 'حسابداری', path: '/dashboard/desk/accounting' }
			];
		}
		if (role === 'doctor') {
			return [
				{ icon: LayoutDashboard, label: 'داشبورد', path: '/dashboard/appointments' },
				{ icon: Users, label: 'مراجعان', path: '/dashboard/patients' }
			];
		}
		return [
			{ icon: LayoutDashboard, label: 'داشبورد', path: '/dashboard' },
			{ icon: CalendarDays, label: 'نوبت‌ها', path: '/dashboard/appointments' },
			{ icon: Calendar, label: 'رزرو', path: '/appointments/book' },
			{ icon: ClipboardList, label: 'تست‌ها', path: '/tests' }
		];
	});

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

	function isActive(path: string) {
		if (path === '/dashboard') return pathname === '/dashboard';
		return pathname === path || pathname.startsWith(path + '/');
	}

	function navigate(path: string) {
		goto(path);
	}

	const bottomCols = $derived(
		user?.role === 'admin' || user?.role === 'doctor' ? 'grid-cols-3' : 'grid-cols-4'
	);
</script>

<svelte:window onkeydown={handleSearchKeydown} />

{#if !hydrated}
	<div class="flex min-h-dvh items-center justify-center bg-background">
		<p class="text-sm text-muted-foreground">در حال بارگذاری...</p>
	</div>
{:else if user}
	<div class="min-h-dvh bg-background">
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
				class="mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] print:p-0 sm:px-5 sm:py-5 md:pb-8 xl:px-6 xl:py-6"
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

		<nav
			class="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-card/95 backdrop-blur print:hidden md:hidden"
		>
			<div class="mx-auto grid max-w-lg {bottomCols}">
				{#each primaryNav as item (item.path)}
					<button
						type="button"
						class="flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors sm:text-[11px] {isActive(
							item.path
						)
							? 'text-primary'
							: 'text-muted-foreground'}"
						onclick={() => navigate(item.path)}
					>
						<item.icon class="h-5 w-5" />
						{item.label}
					</button>
				{/each}
				{#if user.role !== 'admin'}
					<button
						type="button"
						class="flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground sm:text-[11px]"
						onclick={() => (sidebarOpen = true)}
					>
						<Menu class="h-5 w-5" />
						بیشتر
					</button>
				{/if}
			</div>
		</nav>

		<PushEnablePrompt />

		<NotificationToastStack />
	</div>
{:else}
	<div class="flex min-h-dvh items-center justify-center bg-background">
		<p class="text-sm text-muted-foreground">در حال انتقال...</p>
	</div>
{/if}
