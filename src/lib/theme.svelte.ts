export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'hoomban-theme';

let theme = $state<Theme>('light');
let hydrated = $state(false);

function applyTheme(value: Theme) {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('dark', value === 'dark');
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) {
		meta.setAttribute('content', value === 'dark' ? '#0f1f16' : '#1a4d2e');
	}
}

export function getTheme(): Theme {
	return theme;
}

export function isThemeHydrated(): boolean {
	return hydrated;
}

export function hydrateTheme() {
	if (typeof window === 'undefined') return;
	const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	theme = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
	applyTheme(theme);
	hydrated = true;
}

export function setTheme(value: Theme) {
	theme = value;
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, value);
	}
	applyTheme(value);
}

export function toggleTheme() {
	setTheme(theme === 'dark' ? 'light' : 'dark');
}

if (typeof window !== 'undefined') {
	hydrateTheme();
}
