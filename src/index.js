import Point from './point.js';
import Graph from './graph.js';
import Chart, {TicksType, TicksScale} from './chart.js';
import Cursor from './cursor.js';
import Zoombar from './ui/zoombar.js';
import Checkbox from './ui/checkbox.js';

const THEME_STORAGE_KEY = 'telegram-contest-chart_theme';

const Theme = {
	DAY: 'day',
	NIGHT: 'night'
};

const zoomChart = new Chart(document.querySelector('#zoom-chart-canvas'), {
	xTicksType: TicksType.DATE,
	yTicksType: TicksType.COMPACT,
	yTicksScale: TicksScale.NICE,
	topPadding: 30,
	bottomPadding: 40,
	graphLineThickness: 3,
	ticksCount: 6
});

const overviewChart = new Chart(document.querySelector('#overview-chart-canvas'), {
	xTicksType: TicksType.NONE,
	yTicksType: TicksType.NONE,
	topPadding: 10,
	bottomPadding: 10,
	leftPadding: 10,
	rightPadding: 10,
	graphLineThickness: 2
});

const cursor = new Cursor();

const zoombarContainer = document.querySelector('#zoombar');
const zoombar = new Zoombar(zoombarContainer);

const legendContainer = document.querySelector('#legend');
const selectContainer = document.querySelector('#select');
const themeSwitchButton = document.querySelector('#theme-switch-button');

const graphSets = [];
const selectableCharts = [];

let currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || Theme.DAY;

window.addEventListener('load', () => {
	fetch('data.json')
		.then((response) => response.json())
		.then((json) => {
			json.forEach((data) => {
				const {columns, names, colors} = data;

				const xs = columns[0].slice(1).map((value) => new Date(value));
				const set = columns.slice(1).map((values) =>
					new Graph(
						names[values[0]],
						colors[values[0]],
						values.slice(1).map((value, index) => new Point(xs[index], value))
					)
				);

				graphSets.push(set);
			});
		})
		.finally(() => {
			cursor.observe(zoomChart);

			zoombar.setUpdateListener(zoom);

			themeSwitchButton.addEventListener('click', () => {
				selectTheme(currentTheme === Theme.DAY ? Theme.NIGHT : Theme.DAY);
			});

			window.addEventListener('resize', resize);

			graphSets.forEach((set) => {
				const container = document.createElement('div');
				container.classList.add('select__item');

				const canvas = document.createElement('canvas');
				const chart = new Chart(canvas, {
					xTicksType: TicksType.NONE,
					yTicksType: TicksType.NONE,
					topPadding: 10,
					bottomPadding: 10,
					leftPadding: 10,
					rightPadding: 10,
					graphLineThickness: 1
				});

				set.forEach((graph) => {
					chart.addGraph(graph);
				});

				container.appendChild(canvas);
				container.addEventListener('click', () => selectGraphSet(set));

				selectContainer.appendChild(container);
				selectableCharts.push(chart);
			});

			selectableCharts.forEach((chart) => {
				chart.resize();
				chart.draw();
			});

			selectTheme(currentTheme);
			selectGraphSet(graphSets[0]);
		});
});

function selectTheme(theme) {
	document.body.classList.remove(`_${currentTheme}`);
	document.body.classList.add(`_${theme}`);

	localStorage.setItem(THEME_STORAGE_KEY, currentTheme = theme);

	themeSwitchButton.innerText = {
		[Theme.DAY]: 'Switch to Night Mode',
		[Theme.NIGHT]: 'Switch to Day Mode'
	}[theme];

	zoomChart.setTickLineColor({
		[Theme.DAY]: '#eef1f4',
		[Theme.NIGHT]: '#2f3a4b'
	}[theme]);

	zoomChart.setTickTextColor({
		[Theme.DAY]: '#ced4d7',
		[Theme.NIGHT]: '#4e5e6f'
	}[theme]);

	zoomChart.draw();
}

function selectGraphSet(set) {
	zoomChart.clear();
	overviewChart.clear();

	while (legendContainer.firstChild) {
		legendContainer.removeChild(legendContainer.firstChild);
	}

	set.forEach((graph) => {
		const checkboxContainer = document.createElement('div');
		const checkbox = new Checkbox(checkboxContainer, graph.name, graph.color);

		checkbox.setUpdateListener(() => {
			if (checkbox.isChecked()) {
				zoomChart.addGraph(graph);
				zoomChart.draw();

				overviewChart.addGraph(graph);
				overviewChart.draw();
			} else {
				zoomChart.removeGraph(graph);
				zoomChart.draw();

				overviewChart.removeGraph(graph);
				overviewChart.draw();
			}
		});

		zoomChart.addGraph(graph);
		overviewChart.addGraph(graph);

		legendContainer.appendChild(checkboxContainer);
	});

	overviewChart.resize();
	overviewChart.draw();

	zoomChart.resize();
	zoomChart.draw();

	// 10px - size of the grip, consider it
	zoombar.setRange(10, zoombarContainer.offsetWidth - 10);

	Array.from(selectContainer.childNodes)
		.forEach((child, index) => {
			child.classList.remove('_active');

			if (index === graphSets.indexOf(set)) {
				child.classList.add('_active');
			}
		});
}

function resize() {
	[zoomChart, overviewChart, ...selectableCharts].forEach((chart) => {
		chart.resize();
		chart.draw();
	});

	const range = zoomChart.getRange();

	zoombar.setRange(
		overviewChart.getPixelsByX(range.start),
		overviewChart.getPixelsByX(range.end)
	)
}

let drawZoomChart = zoomChart.draw.bind(zoomChart);
function zoom() {
	const range = zoombar.getRange();

	zoomChart.setRange(
		overviewChart.getXByPixels(range.start),
		overviewChart.getXByPixels(range.end)
	);

	requestAnimationFrame(drawZoomChart);
}
