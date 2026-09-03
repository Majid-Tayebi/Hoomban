export type Locale = 'fa' | 'en';

export const DEFAULT_LOCALE: Locale = 'fa';
export const SUPPORTED_LOCALES: Locale[] = ['fa', 'en'];

const messages = {
	fa: {
		'offline.title': 'اتصال اینترنت برقرار نیست',
		'offline.body': 'برخی بخش‌های مراجع (نوبت‌ها و پروفایل) در حالت آفلاین در دسترس هستند.',
		'offline.retry': 'تلاش مجدد',
		'app.name': 'هومبان'
	},
	en: {
		'offline.title': 'You are offline',
		'offline.body': 'Patient areas (appointments and profile) may still be available offline.',
		'offline.retry': 'Try again',
		'app.name': 'Hoomban'
	}
} as const;

export type MessageKey = keyof (typeof messages)['fa'];

export function isLocale(value: string | null | undefined): value is Locale {
	return value === 'fa' || value === 'en';
}

export function resolveLocale(value: string | null | undefined): Locale {
	return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function t(locale: Locale, key: MessageKey): string {
	return messages[locale][key] ?? messages.fa[key];
}
