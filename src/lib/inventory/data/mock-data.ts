import type { InventoryItem, InventoryStat } from '../types';

export const INVENTORY_ITEMS: InventoryItem[] = [
	{
		id: '1',
		name: 'الکترود نوروفیدبک',
		sku: 'NF-EL-01',
		category: 'تجهیزات',
		quantity: 48,
		unit: 'عدد',
		minStock: 20,
		location: 'اتاق نوروتراپی',
		updatedAt: '۱۴۰۴/۰۶/۰۱',
		status: 'in_stock'
	},
	{
		id: '2',
		name: 'ژل رسانا',
		sku: 'NF-GEL-02',
		category: 'مصرفی',
		quantity: 8,
		unit: 'بطری',
		minStock: 12,
		location: 'انبار اصلی',
		updatedAt: '۱۴۰۴/۰۵/۲۸',
		status: 'low'
	},
	{
		id: '3',
		name: 'دستکش یک‌بارمصرف',
		sku: 'MED-GL-03',
		category: 'مصرفی',
		quantity: 0,
		unit: 'بسته',
		minStock: 10,
		location: 'پذیرش',
		updatedAt: '۱۴۰۴/۰۵/۲۰',
		status: 'out'
	},
	{
		id: '4',
		name: 'هدست TDCS',
		sku: 'TD-HS-04',
		category: 'تجهیزات',
		quantity: 6,
		unit: 'دستگاه',
		minStock: 2,
		location: 'اتاق نوروتراپی',
		updatedAt: '۱۴۰۴/۰۶/۰۲',
		status: 'in_stock'
	},
	{
		id: '5',
		name: 'فرم رضایت‌نامه چاپی',
		sku: 'ADM-FM-05',
		category: 'اداری',
		quantity: 120,
		unit: 'برگ',
		minStock: 50,
		location: 'منشی',
		updatedAt: '۱۴۰۴/۰۵/۱۵',
		status: 'in_stock'
	},
	{
		id: '6',
		name: 'ماسک سه‌لایه',
		sku: 'MED-MSK-06',
		category: 'مصرفی',
		quantity: 15,
		unit: 'بسته',
		minStock: 20,
		location: 'انبار اصلی',
		updatedAt: '۱۴۰۴/۰۶/۰۳',
		status: 'low'
	}
];

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
