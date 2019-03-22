import Point from './point.js';
import Graph from './graph.js';
import Chart, {TicksType, TicksScale} from './chart.js';
import Cursor from './cursor.js';
import {createDiv} from './utils.js';
import Zoombar from './ui/zoombar.js';
import Checkbox from './ui/checkbox.js';

/**
 * @const {string}
 */
const THEME_STORAGE_KEY = 'telegram-contest-chart_theme';

/**
 * @enum {string}
 */
const Theme = {
	DAY: 'day',
	NIGHT: 'night'
};

const zoomChartCanvas = /** @type {HTMLCanvasElement} */ (document.querySelector('#zoom-chart-canvas'));
const zoomChart = new Chart(zoomChartCanvas, {
	xTicksType: TicksType.DATE,
	yTicksType: TicksType.COMPACT,
	yTicksScale: TicksScale.NICE,
	topPadding: 30,
	bottomPadding: 40,
	graphLineThickness: 3,
	ticksCount: 6
});

const overviewChartCanvas = /** @type {HTMLCanvasElement} */ (document.querySelector('#overview-chart-canvas'));
const overviewChart = new Chart(overviewChartCanvas, {
	xTicksType: TicksType.NONE,
	yTicksType: TicksType.NONE,
	topPadding: 10,
	bottomPadding: 10,
	leftPadding: 10,
	rightPadding: 10,
	graphLineThickness: 2
});

const cursor = new Cursor();

const zoombarContainer = /** @type {HTMLElement} */ (document.querySelector('#zoombar'));
const zoombar = new Zoombar(zoombarContainer);

const legendContainer = document.querySelector('#legend');
const selectContainer = document.querySelector('#select');
const themeSwitchButton = document.querySelector('#theme-switch-button');

const graphSets = [];
const selectableCharts = [];

let currentTheme = /** @type {Theme} */ (window.localStorage.getItem(THEME_STORAGE_KEY) || Theme.DAY);

window.addEventListener('load', () => {
	fetch('data.json')
		.then((response) => response.json())
		.then((json) => {
			json.forEach((data) => {
				const xs = data['columns'][0].slice(1);
				const set = data['columns'].slice(1).map((values) =>
					new Graph(
						data['names'][values[0]],
						data['colors'][values[0]],
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

			const resizeAsap = () => setTimeout(resize, 0);
			window.addEventListener('resize', resizeAsap);
			window.addEventListener('orientationchange', resizeAsap);

			graphSets.forEach((set) => {
				const container = createDiv('select__chart');
				const canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
				const chart = new Chart(canvas, {
					xTicksType: TicksType.NONE,
					yTicksType: TicksType.NONE,
					topPadding: 5,
					bottomPadding: 5,
					leftPadding: 5,
					rightPadding: 5,
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
			if (graphSets[0]) {
				selectGraphSet(graphSets[0]);
			}
		});
});

/**
 * @param {Theme} theme
 */
function selectTheme(theme) {
	document.body.classList.remove(`_${currentTheme}`);
	document.body.classList.add(`_${theme}`);

	window.localStorage.setItem(THEME_STORAGE_KEY, currentTheme = theme);

	themeSwitchButton.textContent = {
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

/**
 * @param {Array<Graph>} set
 */
function selectGraphSet(set) {
	cursor.clear();
	zoomChart.clear();
	overviewChart.clear();

	while (legendContainer.firstChild) {
		legendContainer.removeChild(legendContainer.firstChild);
	}

	set.forEach((graph) => {
		const checkboxContainer = createDiv();
		const checkbox = new Checkbox(checkboxContainer, graph.name, graph.color);

		checkbox.setUpdateListener(() => {
			let shouldUpdateZoomRange = false;
			if (checkbox.isChecked()) {
				if (!overviewChart.getGraphs().length) {
					shouldUpdateZoomRange = true;
				}

				zoomChart.addGraph(graph);
				overviewChart.addGraph(graph);
			} else {
				zoomChart.removeGraph(graph);
				overviewChart.removeGraph(graph);
			}

			overviewChart.draw();

			if (shouldUpdateZoomRange) {
				const range = zoombar.getRange();
				zoomChart.setRange(
					overviewChart.getXByPixels(range.start),
					overviewChart.getXByPixels(range.end)
				);
			}

			zoomChart.draw();
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
			child.classList.toggle('_active', index === graphSets.indexOf(set));
		});
}

function resize() {
	[zoomChart, overviewChart, ...selectableCharts].forEach((chart) => {
		chart.resize();
		chart.draw();
	});

	const range = zoomChart.getRange();
	const startPixels = overviewChart.getPixelsByX(range.start);
	const endPixels = overviewChart.getPixelsByX(range.end);

	zoombar.setRange(startPixels, endPixels);

	cursor.clear();
}

function zoom() {
	const range = zoombar.getRange();
	const startX = overviewChart.getXByPixels(range.start);
	const endX = overviewChart.getXByPixels(range.end);

	zoomChart.setRange(startX, endX);
	zoomChart.draw();

	cursor.clear();
}
