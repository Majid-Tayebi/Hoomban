<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';

	let { data } = $props();
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-xl font-bold sm:text-2xl">راهنما</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			{data.devDemoAuth ? 'ورود یکپارچه و شماره‌های تست' : 'راهنمای استفاده از پنل'}
		</p>
	</div>

	<Card class="rounded-2xl shadow-sm">
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">پروفایل و منوی حساب</CardTitle>
			<CardDescription>برای همه نقش‌ها (مدیر، منشی، متخصص، نویسنده، مراجع)</CardDescription>
		</CardHeader>
		<CardContent class="space-y-2 px-4 pb-4 text-sm text-muted-foreground sm:px-6">
			<p>
				<strong class="text-foreground">پروفایل و آواتار:</strong> از آیکون حساب کاربری بالای صفحه (کنار
				اعلان‌ها) → «پروفایل». می‌توانید عکس، نام، موبایل، آدرس و رمز عبور را ویرایش کنید.
			</p>
			<p>
				<strong class="text-foreground">تنظیمات سایدبار:</strong> لینک «تنظیمات» از سایدبار حذف شده است.
				مدیر می‌تواند از «مدیریت کلینیک» یا جستجو (Ctrl+K) به تنظیمات پیامک برود؛ سایر نقش‌ها فقط پروفایل
				شخصی دارند.
			</p>
		</CardContent>
	</Card>

	{#if data.devDemoAuth}
	<Card class="rounded-2xl shadow-sm">
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">ورود با موبایل (محیط توسعه)</CardTitle>
			<CardDescription>OTP آزمایشی همیشه ۱۲۳۴ است</CardDescription>
		</CardHeader>
		<CardContent class="space-y-2.5 px-4 pb-4 text-sm sm:px-6">
			<p>اگر شماره در رجیستری کادر درمان باشد همان نقش اعمال می‌شود؛ وگرنه بیمار.</p>
			<div class="rounded-xl border p-3" dir="ltr">
				<p class="mb-1 text-right text-xs text-muted-foreground">بیمار</p>
				<p class="font-mono text-sm">09121111111</p>
			</div>
			<div class="rounded-xl border p-3" dir="ltr">
				<p class="mb-1 text-right text-xs text-muted-foreground">روانشناس — بهناز غلامی</p>
				<p class="font-mono text-sm">09121000001</p>
			</div>
			<div class="rounded-xl border p-3" dir="ltr">
				<p class="mb-1 text-right text-xs text-muted-foreground">منشی</p>
				<p class="font-mono text-sm">09120000003</p>
			</div>
			<div class="rounded-xl border p-3" dir="ltr">
				<p class="mb-1 text-right text-xs text-muted-foreground">مدیر کلینیک</p>
				<p class="font-mono text-sm">09120000004</p>
			</div>
			<p class="text-xs text-muted-foreground">
				۹ متخصص از سایت hoomban.com با موبایل‌های آزمایشی ۰۹۱۲۱۰۰۰۰۰۱ تا ۰۰۰۰۹ تعریف شده‌اند.
			</p>
		</CardContent>
	</Card>
	{/if}

	<Card class="rounded-2xl shadow-sm">
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">محتوای واردشده از سایت فعلی</CardTitle>
		</CardHeader>
		<CardContent class="space-y-2 px-4 pb-4 text-sm text-muted-foreground sm:px-6">
			<p>متخصصین، تعرفه خدمات، مقالات و نظرات مشتریان از محتوای عمومی hoomban.com منتقل شده‌اند.</p>
			<p>نوبت و پرونده بیمار روی سایت قبلی نبود؛ این بخش‌ها فقط در سامانه جدید پیاده‌سازی می‌شوند.</p>
			<p>
				پنل مدیر: <strong>مدیریت کلینیک</strong> با دسترسی کامل؛ منشی: تقویم، متخصصین، خدمات، مقالات و تست (بدون پرونده بیمار).
			</p>
			<p class="text-xs">
				پس از به‌روزرسانی، PocketBase را یک‌بار ری‌استارت کنید تا migration
				<code dir="ltr">1787000000_panel_crm_cms.js</code> اعمال شود.
			</p>
		</CardContent>
	</Card>
</div>
