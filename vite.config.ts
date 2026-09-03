import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('chart.js')) return 'chartjs';
					if (id.includes('node_modules/pocketbase')) return 'pocketbase';
				}
			}
		}
	}
});
