<script lang="ts">
	import { goto } from '$app/navigation';
	import type { DoctorScheduleItem } from '../types';
	import { cn } from '$lib/utils';
	import { Users, Stethoscope } from '@lucide/svelte';

	let { doctors }: { doctors: DoctorScheduleItem[] } = $props();
</script>

<section
	class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/55 bg-card shadow-sm transition-all duration-200 ease-in-out"
>
	<header class="shrink-0 border-b border-border/40 bg-muted/20 px-4 py-3.5">
		<div class="flex items-center gap-2">
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15"
			>
				<Stethoscope class="h-4 w-4" />
			</div>
			<h2 class="text-sm font-semibold tracking-tight">متخصصان</h2>
		</div>
	</header>

	{#if doctors.length === 0}
		<div class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
			<div class="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<Users class="h-5 w-5" />
			</div>
			<p class="text-sm font-medium">متخصصی ثبت نشده است</p>
		</div>
	{:else}
		<ul class="min-h-0 flex-1 space-y-0.5 p-2">
			{#each doctors as doctor (doctor.id)}
				<li>
					<button
						type="button"
						class="group flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-start transition-all duration-200 ease-in-out hover:border-border/60 hover:bg-muted/40"
						onclick={() => goto(`/dashboard/doctors/${doctor.id}`)}
					>
						<div class="relative h-9 w-9 shrink-0">
							{#if doctor.photoUrl}
								<img
									src={doctor.photoUrl}
									alt={doctor.name}
									class="h-full w-full rounded-full object-cover ring-1 ring-border/60"
								/>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-1 ring-primary/10"
								>
									{doctor.initials}
								</div>
							{/if}
							<span
								class={cn(
									'absolute -bottom-0.5 -start-0.5 h-3 w-3 rounded-full ring-2 ring-card',
									doctor.activeToday ? 'bg-emerald-500' : 'bg-red-500'
								)}
								role="status"
								aria-label={doctor.activeToday
									? 'ساعات فعالیت امروز ثبت شده'
									: 'ساعات فعالیت امروز ثبت نشده'}
							></span>
						</div>
						<p class="min-w-0 flex-1 truncate text-sm font-medium leading-snug">{doctor.name}</p>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>
