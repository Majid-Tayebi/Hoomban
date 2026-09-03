import { describe, expect, it, vi } from 'vitest';
import { resolveBookingAmountToman } from '$lib/server/payments/appointment-checkout';
import type PocketBase from 'pocketbase';

function mockPb(handlers: {
	services?: (id: string) => Record<string, unknown>;
	doctors?: (id: string) => Record<string, unknown>;
}): PocketBase {
	return {
		collection(name: string) {
			return {
				async getOne(id: string) {
					if (name === 'services') {
						const row = handlers.services?.(id);
						if (!row) throw new Error('missing service');
						return row;
					}
					if (name === 'doctors') {
						const row = handlers.doctors?.(id);
						if (!row) throw new Error('missing doctor');
						return row;
					}
					throw new Error(`unexpected collection ${name}`);
				}
			};
		}
	} as unknown as PocketBase;
}

describe('resolveBookingAmountToman', () => {
	it('uses doctor visit_fee for in_person bookings', async () => {
		const pb = mockPb({
			doctors: () => ({ visit_fee: 450000 })
		});
		const result = await resolveBookingAmountToman(pb, {
			doctorId: 'doc1',
			type: 'in_person'
		});
		expect(result.amountToman).toBe(450000);
		expect(result.serviceTitle).toBeUndefined();
	});

	it('rejects service checkout without serviceId', async () => {
		const pb = mockPb({});
		await expect(
			resolveBookingAmountToman(pb, { doctorId: 'doc1', type: 'service' })
		).rejects.toThrow(/شناسه خدمت/);
	});

	it('loads service price from PocketBase and ignores client amounts', async () => {
		const getOne = vi.fn(async () => ({
			title: 'مشاوره زوج',
			category: 'مشاوره',
			price: 800000,
			is_active: true
		}));
		const pb = {
			collection: () => ({ getOne })
		} as unknown as PocketBase;

		const result = await resolveBookingAmountToman(pb, {
			doctorId: 'doc1',
			type: 'service',
			serviceId: 'svc-real'
		});

		expect(getOne).toHaveBeenCalledWith('svc-real', expect.anything());
		expect(result.amountToman).toBe(800000);
		expect(result.serviceTitle).toBe('مشاوره زوج');
		expect(result.serviceCategory).toBe('مشاوره');
	});

	it('rejects inactive services', async () => {
		const pb = mockPb({
			services: () => ({ title: 'X', price: 1000, is_active: false })
		});
		await expect(
			resolveBookingAmountToman(pb, {
				doctorId: 'doc1',
				type: 'service',
				serviceId: 'svc-off'
			})
		).rejects.toThrow(/غیرفعال/);
	});
});
