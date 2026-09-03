import type { MessageThread } from '../types';

export function filterThreads(threads: MessageThread[], folder: string, query: string) {
	const q = query.trim();
	return threads.filter((t) => {
		const matchFolder =
			folder === 'inbox'
				? t.folder === 'inbox'
				: folder === 'sent'
					? t.folder === 'sent'
					: folder === 'starred'
						? t.starred
						: true;
		const matchQ =
			!q ||
			t.subject.includes(q) ||
			t.from.includes(q) ||
			t.preview.includes(q) ||
			t.body.includes(q);
		return matchFolder && matchQ;
	});
}
