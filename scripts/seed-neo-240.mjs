import PocketBase from 'pocketbase';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from 'dotenv';

config({ path: '.env.local' });
config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const itemsPath = join(__dirname, '..', 'src', 'lib', 'psych', 'neo-240', 'items.json');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;
const PB_URL = process.env.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

const LIKERT = [
	{ text: 'کاملاً مخالفم', scores: { value: 0 } },
	{ text: 'مخالفم', scores: { value: 1 } },
	{ text: 'نظری ندارم', scores: { value: 2 } },
	{ text: 'موافقم', scores: { value: 3 } },
	{ text: 'کاملاً موافقم', scores: { value: 4 } }
];

const SLUG = 'neo-240';

async function main() {
	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD required');
		process.exit(1);
	}

	const pb = new PocketBase(PB_URL);
	await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

	const items = JSON.parse(readFileSync(itemsPath, 'utf8'));

	let test;
	try {
		test = await pb.collection('psych_tests').getFirstListItem(`slug = "${SLUG}"`);
		console.log('Updating existing NEO-240 test:', test.id);
		await pb.collection('psych_tests').update(test.id, {
			title: 'پرسشنامه شخصیت نئو — فرم بلند (۲۴۰ سوال)',
			description:
				'نسخه بلند NEO PI-R برای سنجش پنج عامل بزرگ شخصیت (روان‌رنجوری، برون‌گرایی، گشودگی، توافق‌پذیری، مسئولیت‌پذیری) و ۳۰ خرده‌مقیاس. زمان تقریبی: ۴۵ تا ۹۰ دقیقه.',
			category: 'personality',
			is_active: true,
			test_type: 'neo_240',
			scoring_config: {
				version: 2,
				likert: LIKERT.map((o) => o.text),
				domains: ['N', 'E', 'O', 'A', 'C'],
				facetBands: { lowMax: 9, mediumMax: 20 },
				domainBands: { lowMax: 95, mediumMax: 127 }
			}
		});
	} catch {
		test = await pb.collection('psych_tests').create({
			title: 'پرسشنامه شخصیت نئو — فرم بلند (۲۴۰ سوال)',
			slug: SLUG,
			description:
				'نسخه بلند NEO PI-R برای سنجش پنج عامل بزرگ شخصیت (روان‌رنجوری، برون‌گرایی، گشودگی، توافق‌پذیری، مسئولیت‌پذیری) و ۳۰ خرده‌مقیاس. زمان تقریبی: ۴۵ تا ۹۰ دقیقه.',
			category: 'personality',
			is_active: true,
			test_type: 'neo_240',
			scoring_config: {
				version: 2,
				likert: LIKERT.map((o) => o.text),
				domains: ['N', 'E', 'O', 'A', 'C'],
				facetBands: { lowMax: 9, mediumMax: 20 },
				domainBands: { lowMax: 95, mediumMax: 127 }
			}
		});
		console.log('Created NEO-240 test:', test.id);
	}

	const existing = await pb.collection('psych_questions').getFullList({
		filter: `test = "${test.id}"`,
		fields: 'id'
	});
	if (existing.length) {
		console.log(`Deleting ${existing.length} old questions...`);
		for (const q of existing) {
			await pb.collection('psych_questions').delete(q.id);
		}
	}

	console.log(`Inserting ${items.length} questions...`);
	for (const item of items) {
		const scorePattern = item.reverse_scored ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
		const options_json = LIKERT.map((opt, i) => ({
			text: opt.text,
			scores: { value: scorePattern[i], score: scorePattern[i] }
		}));
		await pb.collection('psych_questions').create({
			test: test.id,
			question_text: item.question_text,
			order: item.order,
			options_json,
			domain_key: item.domain_key,
			facet_key: item.facet_key,
			reverse_scored: item.reverse_scored
		});
	}

	console.log('NEO-240 seed complete.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
