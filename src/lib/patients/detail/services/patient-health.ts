import type {
	MedicationItem,
	PatientAllergy,
	PatientCondition,
	PatientVital
} from '../types';

export type VitalsChartData = {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		backgroundColor: string;
		borderRadius?: number;
		barThickness?: number;
	}[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseVitals(value: unknown): PatientVital[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter(isRecord)
		.map((row, index) => ({
			id: String(row.id || `vital-${index}`),
			label: String(row.label || ''),
			value: String(row.value || ''),
			icon: (['sugar', 'weight', 'temp'].includes(String(row.icon))
				? row.icon
				: 'weight') as PatientVital['icon']
		}))
		.filter((v) => v.label && v.value);
}

export function parseConditions(value: unknown): PatientCondition[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter(isRecord)
		.map((row, index) => ({
			id: String(row.id || `condition-${index}`),
			label: String(row.label || '')
		}))
		.filter((c) => c.label);
}

export function parseAllergies(value: unknown): PatientAllergy[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter(isRecord)
		.map((row, index) => ({
			id: String(row.id || `allergy-${index}`),
			label: String(row.label || ''),
			color: String(row.color || '#94a3b8')
		}))
		.filter((a) => a.label);
}

export function parseMedications(value: unknown): MedicationItem[] {
	if (!Array.isArray(value)) return [];
	const statuses = new Set(['active', 'completed', 'discontinued']);
	return value
		.filter(isRecord)
		.map((row, index) => ({
			id: String(row.id || `med-${index}`),
			name: String(row.name || ''),
			dosage: String(row.dosage || ''),
			frequency: String(row.frequency || ''),
			period: String(row.period || ''),
			status: (statuses.has(String(row.status))
				? row.status
				: 'active') as MedicationItem['status']
		}))
		.filter((m) => m.name);
}

export function parseVitalsChart(value: unknown): VitalsChartData | null {
	if (!isRecord(value) || !Array.isArray(value.labels) || !Array.isArray(value.datasets)) {
		return null;
	}

	const labels = value.labels.map(String);
	const datasets = value.datasets
		.filter(isRecord)
		.map((ds) => ({
			label: String(ds.label || ''),
			data: Array.isArray(ds.data) ? ds.data.map((n) => Number(n) || 0) : [],
			backgroundColor: String(ds.backgroundColor || '#1e7cae'),
			borderRadius: typeof ds.borderRadius === 'number' ? ds.borderRadius : 4,
			barThickness: typeof ds.barThickness === 'number' ? ds.barThickness : 10
		}))
		.filter((ds) => ds.label && ds.data.length);

	if (!labels.length || !datasets.length) return null;
	return { labels, datasets };
}

export type PatientHealthFields = {
	vitals: PatientVital[];
	conditions: PatientCondition[];
	allergies: PatientAllergy[];
	medications: MedicationItem[];
	vitalsChart: VitalsChartData | null;
};

export function parsePatientHealthFromProfile(record: Record<string, unknown>): PatientHealthFields {
	return {
		vitals: parseVitals(record.vitals),
		conditions: parseConditions(record.conditions),
		allergies: parseAllergies(record.allergies),
		medications: parseMedications(record.medications),
		vitalsChart: parseVitalsChart(record.vitals_chart)
	};
}
