const fontFamily = 'Vazirmatn, sans-serif';

export const trendsChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: { legend: { display: false } },
	scales: {
		x: {
			grid: { display: false },
			ticks: { font: { family: fontFamily, size: 11 } }
		},
		y: {
			beginAtZero: true,
			grid: { color: 'rgba(0,0,0,0.04)' },
			ticks: { font: { family: fontFamily, size: 10 }, stepSize: 10 }
		}
	}
};
