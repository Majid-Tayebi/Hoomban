/**
 * Import official Persian NEO PI-R 240 items + scoring key from PDF extract.
 * Usage: node scripts/import-neo-240-from-pdf.mjs [pdf-path]
 */
import fs from 'node:fs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PDFParse } from 'pdf-parse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'src', 'lib', 'psych', 'neo-240', 'items.json');
const defaultPdf =
	'C:/Users/nobody/Downloads/-5364586621287522557_15412045333441.pdf';

/** Standard NEO PI-R facet → item numbers (Saatchi et al. Persian form). */
const FACET_ITEMS = {
	N1: [1, 31, 61, 91, 121, 151, 181, 211],
	N2: [6, 36, 66, 96, 126, 156, 186, 216],
	N3: [11, 41, 71, 101, 131, 161, 191, 221],
	N4: [16, 46, 76, 106, 136, 166, 196, 226],
	N5: [21, 51, 81, 111, 141, 171, 201, 231],
	N6: [26, 56, 86, 116, 146, 176, 206, 236],
	E1: [2, 32, 62, 92, 122, 152, 182, 212],
	E2: [7, 37, 67, 97, 127, 157, 187, 217],
	E3: [12, 42, 72, 102, 132, 162, 192, 222],
	E4: [17, 47, 77, 107, 137, 167, 197, 227],
	E5: [22, 52, 82, 112, 142, 172, 202, 232],
	E6: [27, 57, 87, 117, 147, 177, 207, 237],
	O1: [3, 33, 63, 93, 123, 153, 183, 213],
	O2: [8, 38, 68, 98, 128, 158, 188, 218],
	O3: [13, 43, 73, 103, 133, 163, 193, 223],
	O4: [18, 48, 78, 108, 138, 168, 198, 228],
	O5: [23, 53, 83, 113, 143, 173, 203, 233],
	O6: [28, 58, 88, 118, 148, 178, 208, 238],
	A1: [4, 34, 64, 94, 124, 154, 184, 214],
	A2: [9, 39, 69, 99, 129, 159, 189, 219],
	A3: [14, 44, 74, 104, 134, 164, 194, 224],
	A4: [19, 49, 79, 109, 139, 169, 199, 229],
	A5: [24, 54, 84, 114, 144, 174, 204, 234],
	A6: [29, 59, 89, 119, 149, 179, 209, 239],
	C1: [5, 35, 65, 95, 125, 155, 185, 215],
	C2: [10, 40, 70, 100, 130, 160, 190, 220],
	C3: [15, 45, 75, 105, 135, 165, 195, 225],
	C4: [20, 50, 80, 110, 140, 170, 200, 230],
	C5: [25, 55, 85, 115, 145, 175, 205, 235],
	C6: [30, 60, 90, 120, 150, 180, 210, 240]
};

const FACET_META = {
	N1: { domain: 'N', label: 'اضطراب' },
	N2: { domain: 'N', label: 'پرخاشگری' },
	N3: { domain: 'N', label: 'افسردگی' },
	N4: { domain: 'N', label: 'حساسیت به خود' },
	N5: { domain: 'N', label: 'تکانش‌وری' },
	N6: { domain: 'N', label: 'آسیب‌پذیری' },
	E1: { domain: 'E', label: 'صمیمیت' },
	E2: { domain: 'E', label: 'جمع‌گرایی' },
	E3: { domain: 'E', label: 'قاطعیت' },
	E4: { domain: 'E', label: 'فعالیت' },
	E5: { domain: 'E', label: 'هیجان‌خواهی' },
	E6: { domain: 'E', label: 'هیجان مثبت' },
	O1: { domain: 'O', label: 'تخیل' },
	O2: { domain: 'O', label: 'زیبایی‌پسندی' },
	O3: { domain: 'O', label: 'احساسات' },
	O4: { domain: 'O', label: 'اعمال' },
	O5: { domain: 'O', label: 'عقاید' },
	O6: { domain: 'O', label: 'ارزش‌ها' },
	A1: { domain: 'A', label: 'اعتماد' },
	A2: { domain: 'A', label: 'سادگی' },
	A3: { domain: 'A', label: 'نوع‌دوستی' },
	A4: { domain: 'A', label: 'تبعییت' },
	A5: { domain: 'A', label: 'شاخص تواضع' },
	A6: { domain: 'A', label: 'درک دیگران' },
	C1: { domain: 'C', label: 'کفایت' },
	C2: { domain: 'C', label: 'نظم و قدرت' },
	C3: { domain: 'C', label: 'وظیفه‌شناسی' },
	C4: { domain: 'C', label: 'تلاش برای موفقیت' },
	C5: { domain: 'C', label: 'خویشتنداری' },
	C6: { domain: 'C', label: 'محتاط در تصمیم‌گیری' }
};

/**
 * Reverse key from PDF scoring tables (کاملاً موافقم row → score 4 means keyed positively).
 * false = agree (index 4) adds to facet; true = disagree adds.
 */
const REVERSE_BY_FACET = {
	N1: [true, false, true, false, true, false, true, false],
	N2: [false, true, false, true, false, true, false, false],
	N3: [true, false, true, false, true, false, true, false],
	N4: [false, true, false, true, false, true, false, true],
	N5: [true, false, true, false, true, false, true, false],
	N6: [false, true, false, true, false, true, false, true],
	E1: [false, true, false, true, false, true, false, true],
	E2: [true, false, true, false, true, false, true, false],
	E3: [false, true, false, true, false, true, false, true],
	E4: [true, false, true, false, true, false, true, false],
	E5: [false, true, false, true, false, true, false, true],
	E6: [true, false, true, false, true, false, true, false],
	O1: [false, true, false, true, false, true, false, true],
	O2: [true, false, true, false, true, false, true, false],
	O3: [false, true, false, true, false, true, false, true],
	O4: [true, false, true, false, true, false, true, false],
	O5: [false, true, false, true, false, true, false, true],
	O6: [true, false, true, false, true, false, true, false],
	A1: [true, false, true, false, true, false, true, false],
	A2: [false, true, false, true, false, true, false, true],
	A3: [true, false, true, false, true, false, true, false],
	A4: [false, true, false, true, false, true, false, true],
	A5: [true, false, true, false, true, false, true, false],
	A6: [false, true, false, true, false, true, false, true],
	C1: [false, true, false, true, false, true, false, true],
	C2: [true, false, true, false, true, false, true, false],
	C3: [false, true, false, true, false, true, false, true],
	C4: [true, false, true, false, true, false, true, false],
	C5: [false, true, false, true, false, true, false, true],
	C6: [true, false, true, false, true, false, true, false]
};

function postProcessQuestionText(text) {
	let t = text
		.replace(/\s+پرسشنامه\s+شخصیتی[\s\S]*$/u, '')
		.replace(/\s+NEOPI-R[\s\S]*$/u, '')
		.replace(/روش\s+نمره\s+گذاری[\s\S]*$/u, '')
		.replace(/می\s+شن\s+اسم/g, 'می‌شناسم')
		.replace(/می\s+شناسم/g, 'می‌شناسم')
		.replace(/نقشه\.\s*قبلی/g, 'نقشه قبلی')
		.replace(/غذاها?ي?\s+ج\s+دید/g, 'غذاهای جدید')
		.replace(/\s+روش\s+نمره[\s\S]*$/u, '')
		.replace(/\s+کلید\s+آزمون[\s\S]*$/u, '')
		.replace(/دیگر\s+ان\b/g, 'دیگران')
		.replace(/نق\s+شه/g, 'نقشه')
		.replace(/ج\s+دید/g, 'جدید')
		.replace(/کاري/g, 'کاری')
		.replace(/غذاهاي/g, 'غذاهای')
		.replace(/کارهاي/g, 'کارهای')
		.replace(/افرادي/g, 'افرادی')
		.replace(/طوري/g, 'طوری')
		.replace(/براي/g, 'برای')
		.replace(/شوم\./g, 'شوم.')
		.trim();

	if (!t.endsWith('.') && !t.endsWith('؟') && !t.endsWith('!')) {
		t += '.';
	}
	return t;
}

function cleanSegment(seg) {
	return postProcessQuestionText(
		seg
			.replace(/\s+/g, ' ')
			.replace(/\u200c/g, '')
			.trim()
	);
}

function normalizePersianLine(line) {
	// PDF uses tabs between many tokens; merge single-char Arabic runs.
	const parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
	const words = [];
	let buffer = '';

	for (const part of parts) {
		const compact = part.replace(/\s/g, '');
		if (compact.length <= 2 && /[\u0600-\u06FF]/.test(compact) && !part.includes(' ')) {
			buffer += compact;
		} else {
			if (buffer) {
				words.push(buffer);
				buffer = '';
			}
			words.push(part);
		}
	}
	if (buffer) words.push(buffer);

	return cleanSegment(words.join(' '))
		.replace(/\s+([،\.؛:!؟])/g, '$1')
		.replace(/\s+\./g, '.')
		.replace(/\s{2,}/g, ' ')
		.normalize('NFKC');
}

function parseQuestions(text) {
	const lines = text.split(/\r?\n/);
	const questions = new Map();
	let current = null;
	let pendingOrder = null;
	let inItems = false;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) continue;
		if (line.includes('ردیف') || line.includes('ردﯾﻒ') || line.includes('عبارت')) {
			inItems = true;
			continue;
		}
		if (!inItems) continue;
		if (line.includes('پرسشنامه') && line.includes('NEO')) break;
		if (line.includes('کلید آزمون') || line.includes('کلید آزمون')) break;
		if (line.startsWith('--')) continue;

		const onlyNum = line.match(/^(\d{1,3})$/);
		if (onlyNum) {
			if (current) questions.set(current.order, current.text);
			pendingOrder = Number(onlyNum[1]);
			current = null;
			continue;
		}

		const m = line.match(/^(\d{1,3})\t(.+)$/);
		if (m) {
			if (current) questions.set(current.order, current.text);
			pendingOrder = null;
			current = { order: Number(m[1]), text: normalizePersianLine(m[2]) };
			continue;
		}

		const extra = normalizePersianLine(line);
		if (!extra || extra.startsWith('--')) continue;

		if (pendingOrder) {
			current = { order: pendingOrder, text: extra };
			pendingOrder = null;
			continue;
		}

		if (current) {
			current.text = cleanSegment(`${current.text} ${extra}`);
			if (current.order === 240) {
				questions.set(240, current.text);
				break;
			}
		}
	}
	if (current && current.order !== 240) questions.set(current.order, current.text);

	return questions;
}

function buildItemMeta() {
	const orderToFacet = new Map();
	const orderToReverse = new Map();

	for (const [facet, nums] of Object.entries(FACET_ITEMS)) {
		const reverses = REVERSE_BY_FACET[facet];
		nums.forEach((n, i) => {
			orderToFacet.set(n, facet);
			orderToReverse.set(n, reverses[i]);
		});
	}
	return { orderToFacet, orderToReverse };
}

async function extractPdfText(pdfPath) {
	const buf = fs.readFileSync(pdfPath);
	const parser = new PDFParse({ data: buf });
	const result = await parser.getText();
	return result.text;
}

async function main() {
	const pdfPath = process.argv[2] || defaultPdf;
	const text = await extractPdfText(pdfPath);
	const questions = parseQuestions(text);
	const { orderToFacet, orderToReverse } = buildItemMeta();

	const items = [];
	const missing = [];

	for (let order = 1; order <= 240; order++) {
		const facet = orderToFacet.get(order);
		if (!facet) throw new Error(`No facet for item ${order}`);
		const meta = FACET_META[facet];
		const question_text = questions.get(order);
		if (!question_text) missing.push(order);

		items.push({
			order,
			question_text: postProcessQuestionText(question_text || `[سوال ${order} — متن یافت نشد]`),
			domain_key: meta.domain,
			facet_key: facet,
			facet_label: meta.label,
			reverse_scored: orderToReverse.get(order)
		});
	}

	if (missing.length) {
		console.warn('Missing question text for orders:', missing.join(', '));
	}

	writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf8');
	console.log(`Wrote ${items.length} items to ${outPath}`);
	console.log('Sample 1:', items[0].question_text);
	console.log('Sample 31:', items[30].question_text);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
