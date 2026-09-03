import { defineConfig, devices } from '@playwright/test';

const APP_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
	testDir: 'e2e',
	timeout: 60_000,
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: APP_URL,
		trace: 'on-first-retry',
		locale: 'fa-IR'
	},
	projects: [
		{ name: 'setup', testMatch: /.*\.setup\.ts/ },
		{
			name: 'chromium',
			dependencies: ['setup'],
			use: {
				...devices['Desktop Chrome'],
				storageState: 'e2e/.auth/patient.json'
			}
		}
	],
	webServer: [
		{
			command: 'node scripts/e2e-pocketbase.mjs',
			url: 'http://127.0.0.1:8090/api/health',
			reuseExistingServer: true,
			timeout: 120_000
		},
		{
			command: 'npm run dev -- --host 127.0.0.1 --port 5173',
			url: APP_URL,
			reuseExistingServer: process.env.PW_REUSE === '1',
			timeout: 120_000,
			env: {
				...process.env,
				DEV_DEMO_AUTH: 'true',
				POCKETBASE_URL: 'http://127.0.0.1:8090',
				PUBLIC_POCKETBASE_URL: 'http://127.0.0.1:8090',
				PUBLIC_APP_URL: APP_URL
			}
		}
	]
});
