export type InventoryStatus = 'in_stock' | 'low' | 'out';

export interface InventoryItem {
	id: string;
	name: string;
	sku: string;
	category: string;
	quantity: number;
	unit: string;
	minStock: number;
	location: string;
	updatedAt: string;
	status: InventoryStatus;
}

export interface InventoryStat {
	id: string;
	label: string;
	value: number;
	subtext: string;
}
