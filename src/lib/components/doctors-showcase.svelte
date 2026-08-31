<script lang="ts">
	import SpecialistsMasonry from '$lib/landing/components/specialists-masonry.svelte';
	import SpecialistReviewsDialog from '$lib/landing/components/specialist-reviews-dialog.svelte';
	import type { LandingDoctor, LandingTestimonial } from '$lib/landing/public-data';

	let {
		doctors,
		testimonials = [],
		onBook
	}: {
		doctors: LandingDoctor[];
		testimonials?: LandingTestimonial[];
		onBook?: (doctorId?: string) => void;
	} = $props();

	let dialogOpen = $state(false);
	let selectedDoctor = $state<LandingDoctor | null>(null);

	function openDoctor(doctor: LandingDoctor) {
		selectedDoctor = doctor;
		dialogOpen = true;
	}

	function handleBook(doctorId: string) {
		dialogOpen = false;
		onBook?.(doctorId);
	}
</script>

<div>
	<SpecialistsMasonry {doctors} onSelect={openDoctor} />

	<SpecialistReviewsDialog
		bind:open={dialogOpen}
		bind:doctor={selectedDoctor}
		reviews={testimonials}
		onBook={handleBook}
	/>
</div>
