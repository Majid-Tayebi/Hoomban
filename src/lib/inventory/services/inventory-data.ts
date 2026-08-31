import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
import type { AuthUser } from '$lib/auth.svelte';
import { formatFaDate } from '$lib/date';
import type { InventoryItem, InventoryStatus } from '../types';

type InventoryUser = NonNullable<AuthUser>;

export function deriveInventoryStatus(quantity: number, minStock: number): InventoryStatus {
	if (quantity <= 0) return 'out';
	if (quantity < minStock) return 'low';
	return 'in_stock';
}

function mapInventoryRecord(row: Record<string, unknown>): InventoryItem {
	const quantity = Number(row.quantity ?? 0);
	const minStock = Number(row.min_stock ?? 0);
	const updated = row.updated ? String(row.updated) : '';

	return {
		id: String(row.id),
		name: String(row.name || ''),
		sku: String(row.sku || ''),
		category: String(row.category || ''),
		quantity,
		unit: String(row.unit || ''),
		minStock,
		location: String(row.location || ''),
		updatedAt: updated ? formatFaDate(new Date(updated)) : '—',
		status: deriveInventoryStatus(quantity, minStock)
	};
}

export async function loadInventoryItems(user: InventoryUser): Promise<InventoryItem[]> {
	if (user.id === 'demo-user') return [];

	try {
		const result = await pb.collection('inventory_items').getList(1, 200, {
			sort: 'name',
			...PB_NO_AUTO_CANCEL
		});
		return result.items.map((row) => mapInventoryRecord(row as unknown as Record<string, unknown>));
	} catch {
		return [];
	}
}

export type CreateInventoryInput = {
	name: string;
	sku: string;
	category: string;
	quantity: number;
	unit: string;
	minStock: number;
	location: string;
};

export async function createInventoryItem(input: CreateInventoryInput): Promise<InventoryItem> {
	const res = await fetch('/api/inventory', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
		},
		body: JSON.stringify(input)
	});
	const data = (await res.json()) as { item?: InventoryItem; error?: string };
	if (!res.ok || !data.item) throw new Error(data.error || 'ثبت قلم ناموفق بود');
	return data.item;
}
