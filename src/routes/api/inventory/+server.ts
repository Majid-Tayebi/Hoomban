import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getAdminPb } from '$lib/server/pocketbase';
import {
	deriveInventoryStatus,
	type CreateInventoryInput
} from '$lib/inventory/services/inventory-data';
import { formatFaDate } from '$lib/date';

function canManageInventory(role: string) {
	return role === 'admin' || role === 'secretary';
}

function mapItem(row: Record<string, unknown>) {
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

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user || !canManageInventory(user.role)) {
		return json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
	}

	try {
		const body = (await request.json()) as CreateInventoryInput;
		const name = String(body.name ?? '').trim();
		const sku = String(body.sku ?? '').trim();
		const category = String(body.category ?? '').trim();
		const unit = String(body.unit ?? '').trim();
		const location = String(body.location ?? '').trim();
		const quantity = Number(body.quantity ?? 0);
		const minStock = Number(body.minStock ?? 0);

		if (!name || !sku || !category || !unit) {
			return json({ error: 'نام، کد، دسته و واحد الزامی است' }, { status: 400 });
		}
		if (quantity < 0 || minStock < 0) {
			return json({ error: 'مقدار و حداقل موجودی نمی‌تواند منفی باشد' }, { status: 400 });
		}

		const pb = await getAdminPb();
		const created = await pb.collection('inventory_items').create({
			name,
			sku,
			category,
			quantity,
			unit,
			min_stock: minStock,
			location
		});

		return json({ item: mapItem(created as unknown as Record<string, unknown>) });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'ثبت قلم ناموفق بود';
		return json({ error: message }, { status: 500 });
	}
};
