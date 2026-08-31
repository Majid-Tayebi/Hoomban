import type { UserRole } from '$lib/auth.svelte';

export const PROFILE_NAV_ANNOUNCEMENT_ID = 'profile-nav-update-v1';
const STORAGE_PREFIX = 'hoomban_dismissed_announcement_';

export function isAnnouncementDismissed(id: string): boolean {
	if (typeof window === 'undefined') return true;
	return localStorage.getItem(`${STORAGE_PREFIX}${id}`) === '1';
}

export function dismissAnnouncement(id: string): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(`${STORAGE_PREFIX}${id}`, '1');
}

export type ProfileNavAnnouncementCopy = {
	title: string;
	lines: string[];
	profileCta: string;
	settingsHint?: string;
};

export function getProfileNavAnnouncementCopy(role?: string | null): ProfileNavAnnouncementCopy {
	const base: ProfileNavAnnouncementCopy = {
		title: 'به‌روزرسانی منوی حساب کاربری',
		lines: [
			'پروفایل شخصی، عکس آواتار و تغییر رمز از منوی حساب (آیکون بالای صفحه، کنار اعلان‌ها) در دسترس است.'
		],
		profileCta: 'رفتن به پروفایل'
	};

	if (role === 'admin') {
		return {
			...base,
			settingsHint: 'تنظیمات کلینیک (پیامک و پیکربندی) از پنل «مدیریت کلینیک» یا جستجوی Ctrl+K در دسترس است.'
		};
	}

	return base;
}

export const PROFILE_NAV_ROLES: UserRole[] = [
	'admin',
	'secretary',
	'doctor',
	'writer',
	'patient'
];
