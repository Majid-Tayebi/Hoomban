import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const input = process.argv[2] ?? 'static/images/landing-hero-brain.jpg';
const output = process.argv[3] ?? 'scripts/image-sources/landing-hero-brain.png';

const { data, info } = await sharp(readFileSync(input)).ensureAlpha().raw().toBuffer({
	resolveWithObject: true
});

const hardCutoff = 32;
const softCutoff = 68;

for (let i = 0; i < data.length; i += 4) {
	const r = data[i];
	const g = data[i + 1];
	const b = data[i + 2];
	const max = Math.max(r, g, b);

	if (max <= hardCutoff) {
		data[i + 3] = 0;
		continue;
	}

	if (max <= softCutoff) {
		const fade = (max - hardCutoff) / (softCutoff - hardCutoff);
		data[i + 3] = Math.min(data[i + 3], Math.round(fade * 255));
	}
}

const processed = await sharp(data, {
	raw: {
		width: info.width,
		height: info.height,
		channels: 4
	}
})
	.png()
	.toBuffer();

writeFileSync(output, processed);
console.log(`Processed ${info.width}x${info.height} from ${input} -> ${output}`);
