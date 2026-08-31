import type { PageServerLoad } from './$types';
import { isDevAuthEnabled } from '$lib/server/dev-auth';

export const load: PageServerLoad = async () => ({
	devDemoAuth: isDevAuthEnabled()
});
