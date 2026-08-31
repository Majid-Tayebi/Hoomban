import type { MessageThread } from '../types';

export const MESSAGE_THREADS: MessageThread[] = [
	{
		id: 'm1',
		from: 'سارا نوری',
		role: 'مدیر کلینیک',
		subject: 'هماهنگی شیفت هفته آینده',
		preview: 'لطفاً برنامه نوروفیدبک را تا چهارشنبه نهایی کنید...',
		body: 'سلام،\n\nلطفاً برنامه نوروفیدبک را تا چهارشنبه نهایی کنید و لیست بیماران را در تقویم به‌روز نگه دارید.\n\nبا تشکر،\nسارا',
		time: '۱۰:۲۴',
		unread: true,
		starred: true,
		folder: 'inbox'
	},
	{
		id: 'm2',
		from: 'رضا کمالی',
		role: 'IT',
		subject: 'به‌روزرسانی سامانه پرونده',
		preview: 'امشب از ۲۳:۰۰ تا ۲۳:۳۰ قطعی کوتاه خواهیم داشت...',
		body: 'همکاران گرامی،\n\nامشب از ۲۳:۰۰ تا ۲۳:۳۰ قطعی کوتاه برای به‌روزرسانی EMR خواهیم داشت.\n\nرضا کمالی',
		time: 'دیروز',
		unread: true,
		starred: false,
		folder: 'inbox'
	},
	{
		id: 'm3',
		from: 'مینا حسینی',
		role: 'کیفیت',
		subject: 'یادآوری فرم رضایت',
		preview: 'نسخه جدید فرم رضایت‌نامه روی میز پذیرش است...',
		body: 'نسخه جدید فرم رضایت‌نامه روی میز پذیرش قرار گرفته. لطفاً نسخه قدیمی را بایگانی کنید.',
		time: '۲ روز پیش',
		unread: false,
		starred: false,
		folder: 'inbox'
	},
	{
		id: 'm4',
		from: 'شما',
		role: 'ارسال‌شده',
		subject: 'درخواست سفارش ژل رسانا',
		preview: 'با توجه به موجودی کم، لطفاً ۱۰ بطری سفارش دهید...',
		body: 'با توجه به موجودی کم ژل رسانا، لطفاً ۱۰ بطری سفارش دهید.',
		time: '۳ روز پیش',
		unread: false,
		starred: false,
		folder: 'sent'
	},
	{
		id: 'm5',
		from: 'النا والدز',
		role: 'عملیات',
		subject: 'بازخورد کارگاه همدلی',
		preview: 'کارگاه دیروز بازخورد مثبت داشت؛ فایل اسلایدها پیوست است...',
		body: 'کارگاه دیروز بازخورد مثبت داشت. فایل اسلایدها را در پوشه آموزش قرار دادم.',
		time: 'هفته پیش',
		unread: false,
		starred: true,
		folder: 'starred'
	}
];

export function filterThreads(threads: MessageThread[], folder: string, query: string) {
	const q = query.trim();
	return threads.filter((t) => {
		const matchFolder =
			folder === 'inbox'
				? t.folder === 'inbox'
				: folder === 'sent'
					? t.folder === 'sent'
					: folder === 'starred'
						? t.starred
						: true;
		const matchQ =
			!q ||
			t.subject.includes(q) ||
			t.from.includes(q) ||
			t.preview.includes(q);
		return matchFolder && matchQ;
	});
}
