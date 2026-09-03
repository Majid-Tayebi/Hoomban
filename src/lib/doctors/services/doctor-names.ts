import { pb, PB_NO_AUTO_CANCEL } from '$lib/pocketbase';
import { buildIdOrFilter } from '$lib/pocketbase-filter';

const DOCTOR_NAME_FIELDS = 'id,display_name,user,expand.user.name';
const DOCTOR_NAME_EXPAND = 'user';

/**
 * Resolve display names for doctor record ids in one (or few) list queries
 * instead of N× getOne.
 */
export async function loadDoctorDisplayNames(
	doctorIds: string[]
): Promise<Map<string, string>> {
	const names = new Map<string, string>();
	const unique = [...new Set(doctorIds.map((id) => id.trim()).filter(Boolean))];
	if (!unique.length) return names;

	const chunkSize = 40;
	for (let i = 0; i < unique.length; i += chunkSize) {
		const chunk = unique.slice(i, i + chunkSize);
		const filter = buildIdOrFilter(chunk);
		if (!filter) continue;
		try {
			const res = await pb.collection('doctors').getList(1, chunk.length, {
				filter,
				fields: DOCTOR_NAME_FIELDS,
				expand: DOCTOR_NAME_EXPAND,
				...PB_NO_AUTO_CANCEL
			});
			for (const doc of res.items) {
				const exp = doc.expand as { user?: { name?: string } } | undefined;
				names.set(
					String(doc.id),
					String(doc.display_name || exp?.user?.name || 'متخصص')
				);
			}
		} catch {
			for (const id of chunk) {
				if (!names.has(id)) names.set(id, 'متخصص');
			}
		}
	}

	for (const id of unique) {
		if (!names.has(id)) names.set(id, 'متخصص');
	}
	return names;
}
