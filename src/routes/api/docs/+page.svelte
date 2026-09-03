<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>API Docs | هومبان</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 px-4 py-10">
	<header class="space-y-2">
		<h1 class="text-2xl font-bold">مستندات API</h1>
		<p class="text-sm text-muted-foreground">
			نسخه {data.version} — مشخصات OpenAPI:
			<a class="text-primary underline" href="/api/openapi.json">/api/openapi.json</a>
		</p>
		<p class="text-sm text-muted-foreground">
			احراز هویت: هدر <code class="rounded bg-muted px-1">Authorization: Bearer &lt;token&gt;</code>
			یا کوکی session.
		</p>
	</header>

	{#each Object.entries(data.grouped) as [tag, items] (tag)}
		<section class="space-y-3">
			<h2 class="text-lg font-semibold capitalize">{tag}</h2>
			<div class="overflow-hidden rounded-xl border border-border">
				<table class="w-full text-sm">
					<thead class="bg-muted/50 text-right">
						<tr>
							<th class="px-3 py-2 font-medium">Method</th>
							<th class="px-3 py-2 font-medium">Path</th>
							<th class="px-3 py-2 font-medium">خلاصه</th>
							<th class="px-3 py-2 font-medium">Auth</th>
						</tr>
					</thead>
					<tbody>
						{#each items as item (item.method + item.path)}
							<tr class="border-t border-border/70">
								<td class="px-3 py-2 font-mono text-xs">{item.method}</td>
								<td class="px-3 py-2 font-mono text-xs" dir="ltr">/api{item.path}</td>
								<td class="px-3 py-2">{item.summary}</td>
								<td class="px-3 py-2">{item.secured ? 'بله' : 'خیر'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/each}
</div>
