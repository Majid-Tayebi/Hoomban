export const PSYCH_TEST_CATEGORIES = [
	{ value: 'personality', label: 'شخصیتی' },
	{ value: 'depression', label: 'افسردگی' },
	{ value: 'marriage', label: 'ازدواج' },
	{ value: 'kids', label: 'کودکان' },
	{ value: 'anxiety', label: 'اضطراب' },
	{ value: 'career', label: 'شغلی' }
] as const;

export type PsychTestCategory = (typeof PSYCH_TEST_CATEGORIES)[number]['value'];

export function psychCategoryLabel(category: string): string {
	return PSYCH_TEST_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
