/**
 * Generate WebP + resized PNG assets for production.
 * Run: node scripts/optimize-images.mjs
 */
import sharp from 'sharp';
import { existsSync } from 'fs';

const tasks = [
	{
		input: 'scripts/image-sources/landing-hero-brain.png',
		outputs: [
			{ path: 'static/images/landing-hero-brain-480.webp', width: 480, quality: 82 },
			{ path: 'static/images/landing-hero-brain-720.webp', width: 720, quality: 82 },
			{ path: 'static/images/landing-hero-brain-480.png', width: 480, png: true }
		]
	},
	{
		input: 'scripts/image-sources/hoomban-logo.png',
		outputs: [
			{ path: 'static/images/hoomban-logo-72.webp', width: 72, quality: 85 },
			{ path: 'static/images/hoomban-logo-192.webp', width: 192, quality: 85 },
			{ path: 'static/images/hoomban-logo-512.webp', width: 512, quality: 85 },
			{ path: 'static/images/hoomban-logo-192.png', width: 192, png: true }
		]
	}
];

for (const task of tasks) {
	if (!existsSync(task.input)) {
		console.warn('skip missing', task.input);
		continue;
	}
	for (const out of task.outputs) {
		const pipeline = sharp(task.input).resize(out.width, out.width, {
			fit: 'inside',
			withoutEnlargement: true
		});
		if (out.png) {
			await pipeline.png({ compressionLevel: 9, palette: true }).toFile(out.path);
		} else {
			await pipeline.webp({ quality: out.quality ?? 82 }).toFile(out.path);
		}
		console.log('wrote', out.path);
	}
}

console.log('done');
