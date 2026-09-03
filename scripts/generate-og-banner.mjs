/**
 * Generate default Open Graph banner (1200×630) from brand logo.
 * Run: node scripts/generate-og-banner.mjs
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';

const logoPath = 'static/images/hoomban-logo-512.webp';
const outPath = 'static/images/og-default.png';

if (!existsSync(logoPath)) {
	console.error('Missing', logoPath);
	process.exit(1);
}

const logo = await sharp(logoPath)
	.resize(280, 280, { fit: 'inside' })
	.png()
	.toBuffer();

await sharp({
	create: {
		width: 1200,
		height: 630,
		channels: 3,
		background: { r: 12, g: 74, b: 110 }
	}
})
	.composite([
		{ input: logo, gravity: 'center' },
		{
			input: Buffer.from(`
				<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
					<text x="600" y="520" text-anchor="middle" font-family="Tahoma, Arial, sans-serif"
						font-size="42" fill="#ffffff" font-weight="700">هومبان</text>
					<text x="600" y="570" text-anchor="middle" font-family="Tahoma, Arial, sans-serif"
						font-size="26" fill="#cce7f5">کلینیک روانشناسی</text>
				</svg>
			`),
			top: 0,
			left: 0
		}
	])
	.png({ compressionLevel: 9 })
	.toFile(outPath);

console.log('wrote', outPath);
