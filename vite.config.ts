import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
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
