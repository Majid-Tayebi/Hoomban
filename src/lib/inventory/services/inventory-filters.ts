import type { InventoryItem, InventoryStat } from '../types';

export function buildInventoryStats(items: InventoryItem[]): InventoryStat[] {
	return [
		{
			id: 'total',
			label: 'کل اقلام',
			value: items.length,
			subtext: 'ثبت‌شده در انبار'
		},
		{
			id: 'low',
			label: 'کم‌موجودی',
			value: items.filter((i) => i.status === 'low').length,
			subtext: 'نیاز به سفارش'
		},
		{
			id: 'out',
			label: 'ناموجود',
			value: items.filter((i) => i.status === 'out').length,
			subtext: 'فوری'
		},
		{
			id: 'ok',
			label: 'موجود کافی',
			value: items.filter((i) => i.status === 'in_stock').length,
			subtext: 'وضعیت سالم'
		}
	];
}

export function filterInventory(items: InventoryItem[], query: string, status: string) {
	const q = query.trim().toLowerCase();
	return items.filter((item) => {
		const matchQ =
			!q ||
			item.name.includes(query.trim()) ||
			item.sku.toLowerCase().includes(q) ||
			item.category.includes(query.trim());
		const matchS = status === 'all' || item.status === status;
		return matchQ && matchS;
	});
}
