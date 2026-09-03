import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			'$env/dynamic/public': path.resolve('./src/lib/test-stubs/env-public.ts'),
			'$env/dynamic/private': path.resolve('./src/lib/test-stubs/env-private.ts')
		}
	},
	test: {
		include: ['src/**/*.test.ts']
	}
});
