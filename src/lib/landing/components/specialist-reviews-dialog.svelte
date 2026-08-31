<script lang="ts">
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import type { LandingDoctor, LandingTestimonial } from '$lib/landing/public-data';
	import { getLandingDoctorPhotoUrl } from '$lib/landing/public-data';
	import { formatAmount } from '$lib/money';
	import { Star, MessageSquareQuote } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	let {
		open = $bindable(false),
		doctor = $bindable(null as LandingDoctor | null),
		reviews = [] as LandingTestimonial[],
		onBook
	}: {
		open?: boolean;
		doctor?: LandingDoctor | null;
		reviews?: LandingTestimonial[];
		onBook?: (doctorId: string) => void;
	} = $props();

	const photo = $derived(doctor ? getLandingDoctorPhotoUrl(doctor) : null);
	const doctorReviews = $derived.by(() => {
		const current = doctor;
		if (!current) return [];
		return reviews.filter((r) => r.doctorId === current.id);
	});
	const avgRating = $derived.by(() => {
		if (!doctorReviews.length) return null;
		const sum = doctorReviews.reduce((acc, r) => acc + (r.rating ?? 0), 0);
		return Math.round((sum / doctorReviews.length) * 10) / 10;
	});

	function memberInitial(name: string): string {
		return name.trim().charAt(0) || '؟';
	}

	function close() {
		open = false;
		doctor = null;
	}
</script>

<Dialog bind:open class="max-h-[min(90dvh,44rem)] w-full max-w-2xl overflow-hidden p-0">
	{#if doctor}
		<div class="flex max-h-[min(90dvh,44rem)] flex-col">
			<div class="flex items-start gap-4 border-b border-border/60 p-5 sm:p-6">
				<div
					class="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-24 sm:w-24"
				>
					{#if photo}
						<img src={photo} alt="" class="h-full w-full object-cover object-top" />
					{:else}
						<div
							class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-muted text-2xl font-bold text-primary"
						>
							{memberInitial(doctor.name)}
						</div>
					{/if}
				</div>
				<div class="min-w-0 flex-1 space-y-2 text-right">
					<div>
						<h2 class="text-lg font-bold leading-snug sm:text-xl">{doctor.name}</h2>
						<p class="mt-0.5 text-sm text-muted-foreground">{doctor.specialty}</p>
					</div>
					<div class="flex flex-wrap items-center justify-end gap-2">
						{#if avgRating}
							<Badge variant="secondary" class="gap-1 rounded-full px-2.5 py-0.5">
								<Star class="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
								{avgRating.toLocaleString('fa-IR')}
								<span class="text-muted-foreground">
									({doctorReviews.length.toLocaleString('fa-IR')} نظر)
								</span>
							</Badge>
						{/if}
						{#if doctor.visitFee > 0}
							<Badge variant="outline" class="rounded-full px-2.5 py-0.5">
								ویزیت {formatAmount(doctor.visitFee)} تومان
							</Badge>
						{/if}
					</div>
					{#if doctor.bio}
						<p class="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
							{doctor.bio}
						</p>
					{/if}
				</div>
			</div>

			<div class="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
				<div class="mb-4 flex items-center gap-2">
					<MessageSquareQuote class="h-4 w-4 text-primary" />
					<h3 class="text-sm font-semibold sm:text-base">نظرات مراجعین</h3>
				</div>

				{#if doctorReviews.length}
					<ul class="space-y-3">
						{#each doctorReviews as review (review.id)}
							<li class="rounded-2xl border border-border/60 bg-card/50 p-4">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0 flex-1 text-right">
										<p class="text-sm font-medium text-foreground">{review.author}</p>
										{#if review.source}
											<p class="mt-0.5 text-[11px] text-muted-foreground">{review.source}</p>
										{/if}
									</div>
									{#if review.rating}
										<span
											class="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600"
										>
											<Star class="h-3.5 w-3.5 fill-current" />
											{review.rating.toLocaleString('fa-IR')}
										</span>
									{/if}
								</div>
								<p class="mt-3 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
							</li>
						{/each}
					</ul>
				{:else}
					<div
						class={cn(
							'rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center'
						)}
					>
						<p class="text-sm font-medium text-foreground">هنوز نظری برای این متخصص ثبت نشده</p>
						<p class="mt-1 text-xs text-muted-foreground">
							پس از دریافت خدمات، نظر شما اینجا نمایش داده می‌شود.
						</p>
					</div>
				{/if}
			</div>

			<div
				class="flex flex-col-reverse gap-2 border-t border-border/60 p-5 sm:flex-row sm:justify-end sm:p-6"
			>
				<Button variant="outline" class="rounded-xl" onclick={close}>بستن</Button>
				<Button class="rounded-xl" onclick={() => doctor && onBook?.(doctor.id)}>رزرو نوبت</Button>
			</div>
		</div>
	{/if}
</Dialog>
