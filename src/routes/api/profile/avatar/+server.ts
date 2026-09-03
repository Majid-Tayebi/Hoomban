import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthUserFromRequest } from '$lib/server/request-auth';
import { getServerPb } from '$lib/server/pocketbase';
import { updateProfileAvatar } from '$lib/server/profile/update-profile';
import { mapProfileRecord } from '$lib/profile/services/profile-mappers';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/** POST /api/profile/avatar — multipart field `avatar` */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await getAuthUserFromRequest(request, cookies);
	if (!user?.token) {
		return json({ error: 'احراز هویت لازم است' }, { status: 401 });
	}

	try {
		const form = await request.formData();
		const file = form.get('avatar');
		if (!(file instanceof File) || file.size <= 0) {
			return json({ error: 'فایل تصویر الزامی است' }, { status: 400 });
		}
		if (file.size > MAX_AVATAR_BYTES) {
			return json({ error: 'حجم تصویر بیش از ۵ مگابایت است' }, { status: 400 });
		}
		if (file.type && !ALLOWED_TYPES.has(file.type)) {
			return json({ error: 'فرمت تصویر مجاز نیست' }, { status: 400 });
		}

		const pb = getServerPb();
		const record = await updateProfileAvatar(pb, user.token, user.id, file);
		return json({ record: mapProfileRecord(record as never, user.token) });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'ذخیره عکس ناموفق بود';
		return json({ error: message }, { status: 400 });
	}
};
