const fontFamily = 'Vazirmatn, sans-serif';

/** Test palette — cerulean / azure-mist / dark-goldenrod */
export const CHART_COLORS = {
	primary: '#1e7cae',
	primaryLight: '#51afe1',
	primaryDark: '#0f3e57',
	secondary: '#7cc3e9',
	children: '#51afe1',
	teens: '#7cc3e9',
	adults: '#1e7cae',
	income: '#1e7cae',
	expense: '#51afe1',
	departments: ['#1e7cae', '#51afe1', '#7cc3e9', '#ebf5f9', '#0f3e57', '#bd9242']
} as const;

export const baseChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: { display: false }
	}
};

export const ageChartOptions = {
	...baseChartOptions,
	scales: {
		x: {
			grid: { display: false },
			ticks: { font: { family: fontFamily, size: 11 } }
		},
		y: {
			beginAtZero: true,
			grid: { color: 'rgba(30, 124, 174, 0.14)' },
			ticks: { font: { family: fontFamily, size: 10 } }
		}
	}
};

export const donutChartOptions = {
	...baseChartOptions,
	cutout: '72%'
};
