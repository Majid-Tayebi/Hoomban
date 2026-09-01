import type { NeoDomainKey, NeoFacetKey } from './meta';
import { NEO_DOMAINS, NEO_FACETS } from './meta';
import type { NeoScoreBand, NeoScores } from './score';

const DOMAIN_TEXT: Record<
	NeoDomainKey,
	Record<NeoScoreBand, { title: string; body: string }>
> = {
	N: {
		low: {
			title: 'روان‌رنجوری پایین',
			body: 'معمولاً آرام‌تر، مقاوم‌تر در برابر استرس و کمتر درگیر هیجانات منفی هستید. در موقعیت‌های فشار، تاب‌آوری بیشتری نشان می‌دهید.'
		},
		medium: {
			title: 'روان‌رنجوری متوسط',
			body: 'در برخی موقعیت‌ها ممکن است نگران یا مضطلب شوید، اما معمولاً می‌توانید خود را تنظیم کنید. پاسخ هیجانی شما در محدوده متعادل است.'
		},
		high: {
			title: 'روان‌رنجوری بالا',
			body: 'تمایل بیشتری به تجربه اضطراب، غم، تنش یا حساسیت هیجانی دارید. در دوره‌های پراسترس، حمایت حرفه‌ای می‌تواند مفید باشد.'
		}
	},
	E: {
		low: {
			title: 'برون‌گرایی پایین',
			body: 'ترجیح می‌دهید تنها یا در گروه‌های کوچک باشید. انرژی خود را بیشتر در فعالیت‌های آرام و درون‌گرایانه بازیابی می‌کنید.'
		},
		medium: {
			title: 'برون‌گرایی متوسط',
			body: 'بسته به موقعیت، می‌توانید اجتماعی یا محتاط باشید. تعادل مناسبی بین تنهایی و تعامل اجتماعی دارید.'
		},
		high: {
			title: 'برون‌گرایی بالا',
			body: 'پرانرژی، اجتماعی و تمایل به تعامل با دیگران دارید. معمولاً از جمع، گفتگو و فعالیت‌های پرتحرک انرژی می‌گیرید.'
		}
	},
	O: {
		low: {
			title: 'گشودگی پایین',
			body: 'به روش‌های آشنا و عملی تمایل دارید و تغییرات ناگهانی را کمتر می‌پسندید. تصمیم‌گیری شما معمولاً محافظه‌کارانه است.'
		},
		medium: {
			title: 'گشودگی متوسط',
			body: 'هم به تجربه‌های جدید و هم به ثبات آشنا اهمیت می‌دهید. تعادل مناسبی بین کنجکاوی و محتاط بودن دارید.'
		},
		high: {
			title: 'گشودگی بالا',
			body: 'کنجکاو، خلاق و پذیرای ایده‌ها و تجربه‌های تازه هستید. به هنر، تفکر انتزاعی و دیدگاه‌های متفاوت علاقه‌مندید.'
		}
	},
	A: {
		low: {
			title: 'توافق‌پذیری پایین',
			body: 'مستقل، رک و گاهی رقابتی هستید. در مذاکره و دفاع از منافع خود قاطع‌تر عمل می‌کنید.'
		},
		medium: {
			title: 'توافق‌پذیری متوسط',
			body: 'بسته به موقعیت می‌توانید همکارانه یا قاطع باشید. بین صراحت و همدلی تعادل دارید.'
		},
		high: {
			title: 'توافق‌پذیری بالا',
			body: 'مهربان، همدل و تمایل به همکاری دارید. به احساسات دیگران توجه می‌کنید و معمولاً از تعارض دوری می‌کنید.'
		}
	},
	C: {
		low: {
			title: 'مسئولیت‌پذیری پایین',
			body: 'انعطاف‌پذیر و گاهی خودانگیخته هستید. ممکن است در برنامه‌ریزی و پیگیری جزئیات کمتر سخت‌گیر باشید.'
		},
		medium: {
			title: 'مسئولیت‌پذیری متوسط',
			body: 'در برخی حوزه‌ها منظم و در برخی دیگر آزادانه‌تر عمل می‌کنید. تعادل بین انضباط و انعطاف دارید.'
		},
		high: {
			title: 'مسئولیت‌پذیری بالا',
			body: 'منظم، هدفمند و قابل اعتماد هستید. برنامه‌ریزی، پشتکار و انجام به‌موقع وظایف برای شما اهمیت دارد.'
		}
	}
};

const FACET_HINTS: Partial<Record<NeoFacetKey, Record<NeoScoreBand, string>>> = {
	N1: {
		low: 'کمتر دچار نگرانی و تنش می‌شوید.',
		medium: 'گاهی نگران می‌شوید اما قابل مدیریت است.',
		high: 'تمایل به نگرانی و اضطراب بیشتر است.'
	},
	E1: {
		low: 'در روابط صمیمی‌تر و گرم‌تر عمل نمی‌کنید.',
		medium: 'بسته به موقعیت صمیمی یا محتاط هستید.',
		high: 'گرم، مهربان و اجتماعی هستید.'
	},
	C2: {
		low: 'نظم و ساختار کمتری در کارها دارید.',
		medium: 'در برخی زمینه‌ها منظم هستید.',
		high: 'دوست دارید همه چیز مرتب و برنامه‌ریزی‌شده باشد.'
	}
};

function domainLabel(key: NeoDomainKey): string {
	return NEO_DOMAINS.find((d) => d.key === key)?.label ?? key;
}

function facetLabel(key: NeoFacetKey): string {
	return NEO_FACETS.find((f) => f.key === key)?.label ?? key;
}

export function buildNeoInterpretation(scores: NeoScores): string {
	const sections: string[] = [
		'تفسیر کلی بر اساس پنج عامل بزرگ شخصیت (NEO PI-R):',
		'این نتایج جنبه‌های کلی شخصیت را نشان می‌دهد و جایگزین تشخیص بالینی نیست.'
	];

	for (const domain of NEO_DOMAINS) {
		const band = scores.domain_bands[domain.key];
		const text = DOMAIN_TEXT[domain.key][band];
		const score = scores.domains[domain.key];
		sections.push(
			`\n【${domain.label} (${domain.key}) — نمره ${score}】\n${text.title}: ${text.body}`
		);
	}

	const notableFacets = NEO_FACETS.filter((facet) => {
		const band = scores.facet_bands[facet.key];
		return band === 'low' || band === 'high';
	}).slice(0, 8);

	if (notableFacets.length) {
		sections.push('\n\nخرده‌مقیاس‌های برجسته:');
		for (const facet of notableFacets) {
			const band = scores.facet_bands[facet.key];
			const hint = FACET_HINTS[facet.key]?.[band];
			const bandFa = band === 'low' ? 'پایین' : band === 'high' ? 'بالا' : 'متوسط';
			sections.push(
				`• ${facet.label} (${facet.key}): ${bandFa} — نمره ${scores.facets[facet.key]}${hint ? ` — ${hint}` : ''}`
			);
		}
	}

	return sections.join('\n');
}

export function buildNeoInterpretationHtml(scores: NeoScores): {
	domains: {
		key: NeoDomainKey;
		label: string;
		score: number;
		band: NeoScoreBand;
		title: string;
		body: string;
	}[];
	facets: {
		key: NeoFacetKey;
		label: string;
		domain: NeoDomainKey;
		score: number;
		band: NeoScoreBand;
	}[];
} {
	return {
		domains: NEO_DOMAINS.map((domain) => {
			const band = scores.domain_bands[domain.key];
			const text = DOMAIN_TEXT[domain.key][band];
			return {
				key: domain.key,
				label: domain.label,
				score: scores.domains[domain.key],
				band,
				title: text.title,
				body: text.body
			};
		}),
		facets: NEO_FACETS.map((facet) => ({
			key: facet.key,
			label: facet.label,
			domain: facet.domain,
			score: scores.facets[facet.key],
			band: scores.facet_bands[facet.key]
		}))
	};
}
