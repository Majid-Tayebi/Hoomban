<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { fetchClinicOverviewStats } from '$lib/dashboard';
	import { formatAmount } from '$lib/money';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import {
		CalendarDays,
		Users,
		Stethoscope,
		Tag,
		FileText,
		UserCog,
		Settings,
		Shield,
		ArrowLeft
	} from '@lucide/svelte';

	let user = $derived(getUser());
	let stats = $state({ appointments: 0, patients: 0, doctors: 0, staff: 0, monthRevenue: 0 });
	let loading = $state(true);

	const modules = [
		{ title: 'تقویم', desc: 'برنامه‌ها و رویدادهای کلینیک', path: '/dashboard/calendar', icon: CalendarDays },
		{ title: 'مراجعان و پرونده', desc: 'دسترسی کامل به پرونده و یادداشت بالینی', path: '/dashboard/patients', icon: Users },
		{ title: 'متخصصین', desc: 'عکس، تعرفه، ساعات کاری', path: '/dashboard/doctors', icon: Stethoscope },
		{ title: 'خدمات و تعرفه', desc: 'قیمت‌گذاری خدمات کلینیک', path: '/dashboard/services', icon: Tag },
		{ title: 'مقالات', desc: 'CMS محتوای سایت', path: '/dashboard/articles', icon: FileText },
		{ title: 'کارکنان', desc: 'مدیریت نقش منشی، پزشک، نویسنده', path: '/dashboard/admin/staff', icon: UserCog },
		{ title: 'تنظیمات کلینیک', desc: 'پیامک، حساب و پیکربندی', path: '/dashboard/settings', icon: Settings }
	];

	async function loadStats() {
		loading = true;
		try {
			stats = await fetchClinicOverviewStats();
		} catch {
			stats = { appointments: 0, patients: 0, doctors: 0, staff: 0, monthRevenue: 0 };
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (user?.role === 'admin') loadStats();
	});
</script>

{#if user?.role !== 'admin'}
	<p class="py-10 text-center text-sm text-muted-foreground">فقط مدیر کلینیک به این بخش دسترسی دارد.</p>
{:else}
	<div class="space-y-6">
		<div class="flex items-start gap-3">
			<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
				<Shield class="h-6 w-6" />
			</div>
			<div>
				<h1 class="text-xl font-bold sm:text-2xl">مدیریت کلینیک</h1>
				<p class="mt-1 text-sm text-muted-foreground">پنل کامل مدیر — CRM، CMS، نوبت، کارکنان و تنظیمات</p>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
			{#each [
				{ label: 'متخصص', value: stats.doctors },
				{ label: 'مراجع', value: stats.patients },
				{ label: 'درآمد ماه', value: stats.monthRevenue, money: true },
				{ label: 'نوبت', value: stats.appointments },
				{ label: 'کارمند', value: stats.staff }
			] as s}
				<Card class="rounded-2xl shadow-sm">
					<CardContent class="p-4 text-center">
						<p class="text-2xl font-bold tabular-nums">
							{loading ? '…' : s.money ? formatAmount(s.value) : s.value.toLocaleString('fa-IR')}
						</p>
						<p class="text-xs text-muted-foreground">{s.label}{s.money ? ' (تومان)' : ''}</p>
					</CardContent>
				</Card>
			{/each}
		</div>

		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each modules as m}
				<button
					type="button"
					class="flex items-start gap-3 rounded-2xl border bg-card p-4 text-right shadow-sm transition hover:bg-muted/40"
					onclick={() => goto(m.path)}
				>
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<m.icon class="h-5 w-5" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="font-semibold">{m.title}</p>
						<p class="mt-1 text-xs text-muted-foreground">{m.desc}</p>
					</div>
					<ArrowLeft class="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
				</button>
			{/each}
		</div>

		<Badge variant="secondary" class="text-xs">مدیر: دسترسی کامل شامل پرونده بالینی و کارکنان</Badge>
	</div>
{/if}
