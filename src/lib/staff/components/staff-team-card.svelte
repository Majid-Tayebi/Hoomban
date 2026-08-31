<script lang="ts">
	import { cn } from '$lib/utils';
	import { Pencil, Trash2 } from '@lucide/svelte';

	let {
		name,
		roleLabel,
		mobile,
		active = true,
		accentClass = 'bg-sky-200 dark:bg-sky-900/50',
		onEdit,
		onDelete
	}: {
		name: string;
		roleLabel: string;
		mobile: string;
		active?: boolean;
		accentClass?: string;
		onEdit: () => void;
		onDelete: () => void;
	} = $props();

	const initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.map((w) => w.charAt(0))
			.slice(0, 2)
			.join('')
	);
</script>

<article class="group flex flex-col gap-1.5 transition-transform duration-200 hover:-translate-y-0.5">
	<div
		class={cn(
			'relative aspect-square w-full overflow-hidden rounded-2xl',
			accentClass,
			!active && 'opacity-60 grayscale'
		)}
	>
		<div class="flex h-full w-full items-center justify-center">
			<span class="text-2xl font-bold tracking-tight text-foreground/80 sm:text-3xl">
				{initials || '؟'}
			</span>
		</div>

		<div
			class="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 bg-gradient-to-t from-black/45 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
		>
			<button
				type="button"
				class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm transition-colors hover:bg-background"
				aria-label="ویرایش {name}"
				onclick={onEdit}
			>
				<Pencil class="h-3.5 w-3.5" />
			</button>
			<button
				type="button"
				class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/95 text-destructive shadow-sm transition-colors hover:bg-background"
				aria-label="حذف {name}"
				onclick={onDelete}
			>
				<Trash2 class="h-3.5 w-3.5" />
			</button>
		</div>
	</div>

	<div class="min-w-0 px-0.5">
		<p class="truncate text-sm font-semibold text-foreground">{name}</p>
		<p class="truncate text-xs text-muted-foreground">{roleLabel}</p>
		<p class="mt-0.5 truncate text-[11px] text-muted-foreground/80" dir="ltr">{mobile}</p>
	</div>
</article>
