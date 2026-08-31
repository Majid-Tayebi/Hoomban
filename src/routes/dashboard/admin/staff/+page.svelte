<script lang="ts">
	import { getUser } from '$lib/auth.svelte';
	import { pb } from '$lib/pocketbase';
	import { requestMobileChange, verifyMobileChange } from '$lib/profile/mobile-change';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Select from '$lib/components/ui/select.svelte';
	import OTPInput from '$lib/components/ui/otp-input.svelte';
	import StaffTeamCard from '$lib/staff/components/staff-team-card.svelte';
	import { globalSearch } from '$lib/search.svelte';
	import { Plus } from '@lucide/svelte';

	type StaffRow = {
		id: string;
		mobile: string;
		role: string;
		name: string;
		active: boolean;
		userId?: string;
	};

	const roleLabels: Record<string, string> = {
		admin: 'مدیر',
		secretary: 'منشی',
		doctor: 'روانشناس',
		writer: 'نویسنده'
	};

	const ACCENT_CLASSES = [
		'bg-sky-200 dark:bg-sky-900/40',
		'bg-violet-200 dark:bg-violet-900/40',
		'bg-indigo-200 dark:bg-indigo-900/40',
		'bg-teal-200 dark:bg-teal-900/40',
		'bg-cyan-200 dark:bg-cyan-900/40',
		'bg-blue-200 dark:bg-blue-900/40'
	];

	let user = $derived(getUser());
	let staff = $state<StaffRow[]>([]);
	let loading = $state(true);
	let showEdit = $state(false);
	let editing = $state<StaffRow | null>(null);
	let originalMobile = $state('');
	let message = $state('');
	let otpStep = $state(false);
	let otpCode = $state('');
	let otpLoading = $state(false);
	let pendingUserId = $state('');

	const filteredStaff = $derived.by(() => {
		const q = globalSearch.query.trim().toLowerCase();
		if (!q) return staff;
		return staff.filter((row) => {
			const role = (roleLabels[row.role] || row.role).toLowerCase();
			return (
				row.name.toLowerCase().includes(q) ||
				row.mobile.includes(q) ||
				role.includes(q) ||
				row.role.toLowerCase().includes(q)
			);
		});
	});

	async function findUserIdByMobile(mobile: string): Promise<string | undefined> {
		try {
			const u = await pb.collection('users').getFirstListItem(`mobile = "${mobile}"`);
			return u.id;
		} catch {
			return undefined;
		}
	}

	async function load() {
		loading = true;
		try {
			const res = await pb.collection('staff_registry').getList(1, 100, { sort: 'role,name' });
			staff = await Promise.all(
				res.items.map(async (r) => {
					const mobile = String(r.mobile);
					return {
						id: r.id,
						mobile,
						role: String(r.role),
						name: String(r.name),
						active: Boolean(r.active !== false),
						userId: await findUserIdByMobile(mobile)
					};
				})
			);
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'خطا در بارگذاری';
			staff = [];
		} finally {
			loading = false;
		}
	}

	function openNew() {
		editing = { id: '', mobile: '', role: 'secretary', name: '', active: true };
		originalMobile = '';
		otpStep = false;
		otpCode = '';
		showEdit = true;
		message = '';
	}

	function openEdit(row: StaffRow) {
		editing = { ...row };
		originalMobile = row.mobile;
		otpStep = false;
		otpCode = '';
		pendingUserId = row.userId || '';
		showEdit = true;
		message = '';
	}

	async function saveStaffViaApi(payload: {
		id?: string;
		mobile: string;
		name: string;
		role: string;
		active: boolean;
	}) {
		const res = await fetch('/api/admin/staff', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${pb.authStore.token}`
			},
			body: JSON.stringify({ ...payload, token: pb.authStore.token })
		});
		const data = (await res.json()) as { error?: string };
		if (!res.ok) throw new Error(data.error || 'ذخیره ناموفق');
	}

	async function saveWithoutMobileChange() {
		if (!editing) return;
		await saveStaffViaApi({
			id: editing.id || undefined,
			mobile: editing.mobile.trim(),
			role: editing.role,
			name: editing.name.trim(),
			active: editing.active
		});
		showEdit = false;
		otpStep = false;
		message = editing.id ? 'همکار به‌روزرسانی شد' : 'همکار جدید ثبت شد — می‌تواند با OTP وارد شود';
		await load();
	}

	async function save() {
		if (!editing?.mobile.trim() || !editing.name.trim()) {
			message = 'موبایل و نام الزامی است';
			return;
		}

		const mobileChanged = Boolean(editing.id && editing.mobile.trim() !== originalMobile);

		try {
			if (!mobileChanged) {
				await saveWithoutMobileChange();
				return;
			}

			// Need linked user for OTP mobile change
			let targetUserId = editing.userId || pendingUserId;
			if (!targetUserId) {
				targetUserId = (await findUserIdByMobile(originalMobile)) || '';
			}
			if (!targetUserId) {
				message =
					'برای تغییر موبایل باید حساب کاربری با شماره قبلی وجود داشته باشد. ابتدا کاربر را از طریق ورود بسازید.';
				return;
			}

			otpLoading = true;
			const req = await requestMobileChange({
				newMobile: editing.mobile.trim(),
				targetUserId
			});
			otpLoading = false;
			if (!req.ok) {
				message = req.error;
				return;
			}
			pendingUserId = req.targetUserId;
			otpStep = true;
			message = req.demoCode
				? `کد به شماره جدید ارسال شد (آزمایشی: ${req.demoCode})`
				: req.message;
		} catch (e: unknown) {
			otpLoading = false;
			message = e instanceof Error ? e.message : 'ذخیره ناموفق';
		}
	}

	async function confirmOtpAndSave() {
		if (!editing) return;
		otpLoading = true;
		message = '';
		try {
			const verified = await verifyMobileChange({
				newMobile: editing.mobile.trim(),
				code: otpCode,
				targetUserId: pendingUserId
			});
			if (!verified.ok) {
				message = verified.error;
				return;
			}
			await pb.collection('staff_registry').update(editing.id, {
				mobile: editing.mobile.trim(),
				role: editing.role,
				name: editing.name.trim(),
				active: editing.active
			});
			showEdit = false;
			otpStep = false;
			await load();
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'تأیید ناموفق';
		} finally {
			otpLoading = false;
		}
	}

	async function remove(id: string) {
		if (!confirm('حذف این کارمند از رجیستری؟')) return;
		try {
			await pb.collection('staff_registry').delete(id);
			await load();
		} catch (e: unknown) {
			message = e instanceof Error ? e.message : 'حذف ناموفق';
		}
	}

	$effect(() => {
		if (user?.role === 'admin') load();
	});
</script>

<div class="space-y-4">
	{#if user?.role !== 'admin'}
		<p class="text-sm text-destructive">فقط مدیر به مدیریت کارکنان دسترسی دارد.</p>
	{:else}
		<div class="flex items-start justify-between gap-3">
			<div>
				<h1 class="text-xl font-bold sm:text-2xl">همکاران</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					ثبت همکار جدید بدون OTP — تأیید موبایل در پروفایل خودش انجام می‌شود
				</p>
			</div>
			<Button class="rounded-xl" onclick={openNew}>
				<Plus class="ml-1 h-4 w-4" />
				افزودن
			</Button>
		</div>

		{#if message && !showEdit}
			<p class="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
		{/if}

		{#if loading}
			<p class="py-10 text-center text-sm text-muted-foreground">در حال بارگذاری...</p>
		{:else if filteredStaff.length === 0}
			<p class="py-10 text-center text-sm text-muted-foreground">
				{staff.length === 0 ? 'کارمندی ثبت نشده.' : 'نتیجه‌ای یافت نشد.'}
			</p>
		{:else}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
				{#each filteredStaff as row, i (row.id)}
					<StaffTeamCard
						name={row.name}
						roleLabel={roleLabels[row.role] || row.role}
						mobile={row.mobile}
						active={row.active}
						accentClass={ACCENT_CLASSES[i % ACCENT_CLASSES.length]}
						onEdit={() => openEdit(row)}
						onDelete={() => remove(row.id)}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<Dialog open={showEdit}>
	{#if editing}
		<div class="space-y-3">
			<h2 class="text-lg font-bold">
				{#if otpStep}
					تأیید شماره جدید
				{:else}
					{editing.id ? 'ویرایش کارمند' : 'کارمند جدید'}
				{/if}
			</h2>

			{#if !otpStep}
				<div class="space-y-1.5">
					<Label>نام</Label>
					<Input bind:value={editing.name} />
				</div>
				<div class="space-y-1.5">
					<Label>موبایل</Label>
					<Input bind:value={editing.mobile} dir="ltr" placeholder="0912xxxxxxx" />
					{#if editing.id}
						<p class="text-xs text-muted-foreground">
							در صورت تغییر موبایل، کد تأیید به شماره جدید ارسال می‌شود.
						</p>
					{:else}
						<p class="text-xs text-muted-foreground">
							شماره باید یکتا باشد. همکار می‌تواند بلافاصله با OTP وارد شود.
						</p>
					{/if}
				</div>
				<div class="space-y-1.5">
					<Label>نقش</Label>
					<Select bind:value={editing.role}>
						<option value="admin">مدیر</option>
						<option value="secretary">منشی</option>
						<option value="doctor">روانشناس</option>
						<option value="writer">نویسنده</option>
					</Select>
				</div>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={editing.active} />
					فعال
				</label>
			{:else}
				<p class="text-sm text-muted-foreground">
					کد ارسال‌شده به <span dir="ltr">{editing.mobile}</span> را وارد کنید
				</p>
				<OTPInput
					length={4}
					onValueChange={(v) => (otpCode = v)}
					onComplete={(v) => (otpCode = v)}
					disabled={otpLoading}
				/>
			{/if}

			{#if message}
				<p class="text-sm text-destructive">{message}</p>
			{/if}
			<div class="flex gap-2">
				<Button
					variant="outline"
					class="flex-1 rounded-xl"
					onclick={() => {
						showEdit = false;
						otpStep = false;
					}}
				>
					انصراف
				</Button>
				{#if otpStep}
					<Button
						class="flex-1 rounded-xl"
						onclick={confirmOtpAndSave}
						disabled={otpLoading || otpCode.length < 4}
					>
						تأیید و ذخیره
					</Button>
				{:else}
					<Button class="flex-1 rounded-xl" onclick={save} disabled={otpLoading}>ذخیره</Button>
				{/if}
			</div>
		</div>
	{/if}
</Dialog>
