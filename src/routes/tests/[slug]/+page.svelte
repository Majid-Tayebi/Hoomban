<script lang="ts">
	import { goto } from '$app/navigation';
	import { getUser } from '$lib/auth.svelte';
	import { loginRedirectUrl } from '$lib/auth-redirect';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import NeoTestRunner from '$lib/tests/components/neo-test-runner.svelte';
	import GenericTestRunner from '$lib/tests/components/generic-test-runner.svelte';
	import SeoHead from '$lib/components/seo-head.svelte';

	let { data } = $props();

	let user = $derived(getUser());
	const test = $derived(data.test);
	const questions = $derived(data.questions);
	const isNeo240 = $derived(test.test_type === 'neo_240');
	const testPath = $derived(`/tests/${test.slug}`);
	const authed = $derived(Boolean(user?.id && user.id !== 'demo-user'));

	$effect(() => {
		if (!authed) goto(loginRedirectUrl(testPath));
	});
</script>

<SeoHead
	title={`${test.title} | آزمون روان‌شناختی`}
	description={test.description ?? `اجرای آنلاین آزمون ${test.title} در کلینیک هومبان`}
	path={testPath}
/>

{#if !authed}
	<p class="py-16 text-center text-sm text-muted-foreground">در حال انتقال به صفحه ورود...</p>
{:else if isNeo240}
	<NeoTestRunner testId={test.id} testTitle={test.title} slug={test.slug} />
{:else if questions.length > 0}
	<GenericTestRunner testId={test.id} testTitle={test.title} slug={test.slug} {questions} />
{:else}
	<Card class="rounded-2xl shadow-sm">
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">آزمون در دسترس نیست</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4 px-4 pb-4 sm:px-6">
			<p class="text-sm text-muted-foreground">سوالی برای این آزمون ثبت نشده است.</p>
			<Button class="h-11 w-full rounded-xl" onclick={() => goto('/tests')}>بازگشت به آزمون‌ها</Button>
		</CardContent>
	</Card>
{/if}
