<script lang="ts">
	import { page } from '$app/stores';
	import { pb } from '$lib/pocketbase';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import { onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';

	let id = $derived($page.params.id ?? '');
	let result = $state<{
		interpretation_text: string;
		scores_json: string;
		answers_json: string;
	} | null>(null);
	let test = $state<{ title: string } | null>(null);
	let isLoading = $state(true);
	let error = $state('');
	let chart: Chart | null = null;
	let canvasElement = $state<HTMLCanvasElement | null>(null);

	async function loadResult() {
		if (!id) return;
		isLoading = true;
		error = '';
		try {
			const resultData = await pb.collection('psych_results').getOne(id, {
				expand: 'test,user'
			});
			result = {
				interpretation_text: resultData.interpretation_text,
				scores_json: resultData.scores_json,
				answers_json: resultData.answers_json
			};
			test = resultData.expand?.test ? { title: resultData.expand.test.title } : { title: 'نتیجه تست' };
		} catch (err: unknown) {
			const e = err as { message?: string };
			error = 'خطا در بارگذاری نتیجه: ' + (e.message || 'نتیجه یافت نشد');
		} finally {
			isLoading = false;
		}
	}

	function createChart() {
		if (!canvasElement || !result) return;

		const scores = JSON.parse(result.scores_json) as Record<string, number>;
		const labels = Object.keys(scores);
		const data = Object.values(scores).map(Number);

		if (chart) chart.destroy();

		chart = new Chart(canvasElement, {
			type: 'radar',
			data: {
				labels,
				datasets: [
					{
						label: 'امتیازات',
						data,
						backgroundColor: 'hsla(152, 48%, 20%, 0.15)',
						borderColor: 'hsl(152, 48%, 20%)',
						borderWidth: 2,
						pointBackgroundColor: 'hsl(152, 48%, 20%)',
						pointBorderColor: '#fff'
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				scales: {
					r: {
						beginAtZero: true,
						ticks: { display: false },
						pointLabels: { font: { family: 'Vazirmatn', size: 11 } }
					}
				},
				plugins: { legend: { display: false } }
			}
		});
	}

	$effect(() => {
		if (id) loadResult();
	});

	$effect(() => {
		if (result && canvasElement) {
			createChart();
		}
	});

	onDestroy(() => {
		chart?.destroy();
	});
</script>

{#if isLoading}
	<p class="py-16 text-center text-sm text-muted-foreground">در حال بارگذاری نتیجه...</p>
{:else if error}
	<Card class="rounded-2xl shadow-sm">
		<CardHeader class="px-4 pt-4 sm:px-6">
			<CardTitle class="text-base">خطا</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4 px-4 pb-4 sm:px-6">
			<p class="text-sm text-destructive">{error}</p>
			<Button class="h-11 w-full rounded-xl" onclick={() => goto('/dashboard')}>بازگشت</Button>
		</CardContent>
	</Card>
{:else if result && test}
	<div class="mx-auto max-w-2xl space-y-4">
		<div>
			<h1 class="text-xl font-bold sm:text-2xl">{test.title}</h1>
			<p class="mt-1 text-sm text-muted-foreground">نتیجه تست شما</p>
		</div>

		<Card class="rounded-2xl shadow-sm">
			<CardHeader class="px-4 pt-4 sm:px-6">
				<CardTitle class="text-base">تحلیل نتیجه</CardTitle>
			</CardHeader>
			<CardContent class="px-4 pb-4 sm:px-6">
				<p class="text-sm leading-relaxed sm:text-base">{result.interpretation_text}</p>
			</CardContent>
		</Card>

		<Card class="rounded-2xl shadow-sm">
			<CardHeader class="px-4 pt-4 sm:px-6">
				<CardTitle class="text-base">نمودار امتیازات</CardTitle>
			</CardHeader>
			<CardContent class="flex justify-center px-4 pb-4 sm:px-6">
				<div class="w-full max-w-sm">
					<canvas bind:this={canvasElement}></canvas>
				</div>
			</CardContent>
		</Card>

		<Card class="rounded-2xl shadow-sm">
			<CardHeader class="px-4 pt-4 sm:px-6">
				<CardTitle class="text-base">پاسخ‌های شما</CardTitle>
			</CardHeader>
			<CardContent class="space-y-2.5 px-4 pb-4 sm:px-6">
				{#each JSON.parse(result.answers_json) as answer}
					<div class="rounded-xl border p-3.5">
						<p class="text-sm font-medium">{answer.question_text}</p>
						<p class="mt-1 text-xs text-muted-foreground">پاسخ: {answer.selected_option}</p>
					</div>
				{/each}
			</CardContent>
		</Card>

		<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
			<Button class="h-11 rounded-xl" onclick={() => window.print()}>چاپ / PDF</Button>
			<Button variant="outline" class="h-11 rounded-xl" onclick={() => goto('/dashboard')}>
				بازگشت به داشبورد
			</Button>
		</div>
	</div>
{/if}
