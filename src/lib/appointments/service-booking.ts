/** Shared helpers for service-based appointments (notes_public + type). */

export const SERVICE_NOTE_PREFIX = 'خدمت:';

export type ParsedServiceBooking = {
	title: string;
	category?: string;
};

export function formatServiceNote(service: { title: string; category?: string }): string {
	const category = service.category?.trim();
	return `${SERVICE_NOTE_PREFIX} ${service.title.trim()}${category ? ` (${category})` : ''}`;
}

export function parseServiceNote(note: string): ParsedServiceBooking | null {
	const trimmed = note.trim();
	if (!trimmed.startsWith(SERVICE_NOTE_PREFIX)) return null;

	const rest = trimmed.slice(SERVICE_NOTE_PREFIX.length).trim();
	if (!rest) return null;

	const paren = rest.match(/^(.+?)\s*\((.+)\)\s*$/);
	if (paren) {
		return { title: paren[1].trim(), category: paren[2].trim() };
	}
	return { title: rest };
}

export function isServiceAppointment(type: string, note?: string | null): boolean {
	if (type === 'service') return true;
	return Boolean(note?.trim().startsWith(SERVICE_NOTE_PREFIX));
}
