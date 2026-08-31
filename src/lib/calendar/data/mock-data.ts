import type { ScheduleEvent } from '../types';
import { toIsoDate, startOfMonth, addMonths } from '../utils/calendar-grid';
import { addDays } from '$lib/date';

/** Demo service appointments anchored to the visible Jalali month. */
export function buildMockServiceSchedules(anchor = new Date()): ScheduleEvent[] {
	const base = startOfMonth(anchor);
	const next = startOfMonth(addMonths(anchor, 1));

	const d = (day: number) => toIsoDate(addDays(base, day - 1));
	const n = (day: number) => toIsoDate(addDays(next, day - 1));

	return [
		{
			id: 'svc-1',
			title: 'نوروفیدبک — جلسه گروهی',
			category: 'service',
			date: d(4),
			startTime: '10:00',
			endTime: '11:30',
			location: 'اتاق نوروفیدبک',
			participants: '۴ مراجع',
			lead: { name: 'بهناز غلامی', role: 'اپراتور نوروفیدبک', initials: 'بغ' },
			note: 'جلسه اول دوره درمان',
			statusLabel: 'تأیید'
		},
		{
			id: 'svc-2',
			title: 'QEEG — ثبت سیگنال',
			category: 'service',
			date: d(7),
			startTime: '09:30',
			endTime: '10:30',
			location: 'اتاق QEEG',
			participants: 'مجید طیبی',
			lead: { name: 'ثمین حسنی', role: 'روانشناس', initials: 'ثح' },
			note: 'ثبت قبل از شروع درمان'
		},
		{
			id: 'svc-3',
			title: 'گروه درمانی اضطراب',
			category: 'service',
			date: d(9),
			startTime: '16:00',
			endTime: '17:30',
			location: 'سالن گروه‌درمانی',
			participants: '۶ مراجع',
			lead: { name: 'ناهید براتی', role: 'روانشناس', initials: 'نب' },
			note: 'جلسه هفتگی گروه B'
		},
		{
			id: 'svc-4',
			title: 'ارزیابی روانشناختی',
			category: 'service',
			date: d(12),
			startTime: '11:00',
			endTime: '12:30',
			location: 'اتاق ارزیابی',
			participants: 'مریم قادری',
			lead: { name: 'دکتر احمدی', role: 'روانشناسی', initials: 'دا' },
			note: 'MMPI و مصاحبه ساختاریافته'
		},
		{
			id: 'svc-5',
			title: 'EMDR — جلسه درمان',
			category: 'service',
			date: d(14),
			startTime: '14:00',
			endTime: '15:00',
			location: 'اتاق درمان ۲',
			participants: 'بیمار آزمایشی',
			lead: { name: 'ثمین حسنی', role: 'روانشناس', initials: 'ثح' },
			note: 'جلسه سوم پروتکل'
		},
		{
			id: 'svc-6',
			title: 'کارگاه والدین',
			category: 'service',
			date: d(19),
			startTime: '17:00',
			endTime: '18:30',
			location: 'سالن آموزش',
			participants: '۱۲ نفر',
			lead: { name: 'بهناز غلامی', role: 'روانشناس', initials: 'بغ' },
			note: 'مدیریت رفتار کودک'
		},
		{
			id: 'svc-7',
			title: 'نوروفیدبک — پیگیری',
			category: 'service',
			date: d(22),
			startTime: '10:30',
			endTime: '11:15',
			location: 'اتاق نوروفیدبک',
			participants: '۲ مراجع',
			lead: { name: 'بهناز غلامی', role: 'اپراتور نوروفیدبک', initials: 'بغ' },
			note: 'جلسات پایانی دوره'
		},
		{
			id: 'svc-8',
			title: 'QEEG — گزارش و تحلیل',
			category: 'service',
			date: n(2),
			startTime: '15:00',
			endTime: '16:00',
			location: 'اتاق QEEG',
			participants: 'مراجع جدید',
			lead: { name: 'ثمین حسنی', role: 'روانشناس', initials: 'ثح' },
			note: 'تحویل گزارش به متخصص'
		}
	];
}

/** @deprecated Use buildMockServiceSchedules */
export function buildMockSchedules(anchor = new Date()): ScheduleEvent[] {
	return buildMockServiceSchedules(anchor);
}
