type SortableNotification = {
	id: string;
	created?: string;
	readAt?: string | null;
	read_at?: string | null;
};

function isUnread(item: SortableNotification): boolean {
	return !(item.readAt ?? item.read_at);
}

export function sortNotificationsNewestFirst<T extends SortableNotification>(items: T[]): T[] {
	return [...items].sort((a, b) => {
		const aUnread = isUnread(a);
		const bUnread = isUnread(b);
		if (aUnread !== bUnread) return aUnread ? -1 : 1;

		const tb = Date.parse(String(b.created || ''));
		const ta = Date.parse(String(a.created || ''));
		if (Number.isFinite(tb) && Number.isFinite(ta) && tb !== ta) return tb - ta;
		return b.id.localeCompare(a.id);
	});
}
