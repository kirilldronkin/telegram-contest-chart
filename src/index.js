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
 * @const {string}
 */
const MOBILE_MEDIA_QUERY = 'only screen and (max-width: 480px) and (orientation: portrait)';

/**
 * @const {number}
 */
const ZOOMBAR_GRIP_SIZE = 15;

/**
 * @enum {string}
 */
const Theme = {
	DAY: 'day',
	NIGHT: 'night'
};

const mobileMedia = window.matchMedia(MOBILE_MEDIA_QUERY);

const zoomChartCanvas = /** @type {HTMLCanvasElement} */ (document.querySelector('#zoom-chart-canvas'));
const zoomChart = new Chart(zoomChartCanvas, {
	xTicksType: TicksType.DATE,
	yTicksType: TicksType.COMPACT,
	yTicksScale: TicksScale.NICE,
	yTicksBackground: true,
	topPadding: 30,
	bottomPadding: 40,
	ticksCount: mobileMedia.matches ? 3 : 5,
	graphLineThickness: mobileMedia.matches ? 2 : 3,
	emptyText: 'No data'
});

const overviewChartCanvas = /** @type {HTMLCanvasElement} */ (document.querySelector('#overview-chart-canvas'));
const overviewChart = new Chart(overviewChartCanvas, {
	xTicksType: TicksType.NONE,
	yTicksType: TicksType.NONE,
	topPadding: 10,
	bottomPadding: 10,
	leftPadding: 15,
	rightPadding: 15,
	graphLineThickness: mobileMedia.matches ? 1 : 2
});

const cursor = new Cursor();

const zoombarContainer = /** @type {HTMLElement} */ (document.querySelector('#zoombar'));
const zoombar = new Zoombar(zoombarContainer);

const title = document.querySelector('#title');
const legendContainer = document.querySelector('#legend');
const selectContainer = document.querySelector('#select');
const themeSwitchButton = document.querySelector('#theme-switch-button');
const repoLink = document.querySelector('#repo-link');

const graphSets = [];
const selectableCharts = [];

let currentTheme = /** @type {Theme} */ (window.localStorage.getItem(THEME_STORAGE_KEY) || Theme.DAY);

window.addEventListener('load', () => {
	fetch('data.json')
		.then((response) => response.json())
		.then((json) => {
			json.forEach((data) => {
				const xs = data['columns'].find((values) => values[0] === 'x').slice(1);
				const ys = data['columns'].filter((values) => values[0].startsWith('y'));

				const set = ys.map(([name, ...values]) =>
					new Graph(
						data['names'][name],
						data['colors'][name],
						values.map((value, index) => new Point(xs[index], value)))
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

			mobileMedia.addListener(() => {
				zoomChart.setTicksCount(mobileMedia.matches ? 3 : 5);
				zoomChart.setGraphLineThickness(mobileMedia.matches ? 2 : 3);
				overviewChart.setGraphLineThickness(mobileMedia.matches ? 1 : 2);

				resize();
			});

			window.addEventListener('resize', resize);
			window.addEventListener('orientationchange', resize);

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

			repoLink.textContent = 'https://github.com/kirilldronkin/telegram-contest-chart';
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
		[Theme.DAY]: '#dfe7eb',
		[Theme.NIGHT]: '#394959'
	}[theme]);

	zoomChart.setTickTextColor({
		[Theme.DAY]: '#a9b3b9',
		[Theme.NIGHT]: '#4c5f6f'
	}[theme]);

	zoomChart.setTickBackgroundColor({
		[Theme.DAY]: '#ffffff',
		[Theme.NIGHT]: '#232f3d'
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
			if (checkbox.isChecked()) {
				zoomChart.addGraph(graph);
				overviewChart.addGraph(graph);
			} else {
				zoomChart.removeGraph(graph);
				overviewChart.removeGraph(graph);
			}

			overviewChart.draw();

			const range = zoombar.getRange();
			zoomChart.setRange(
				overviewChart.getXByPixels(range.start),
				overviewChart.getXByPixels(range.end)
			);

			zoomChart.draw();
		});

		zoomChart.addGraph(graph);
		overviewChart.addGraph(graph);

		legendContainer.appendChild(checkboxContainer);
	});

	zoomChart.resize();
	zoomChart.draw();

	overviewChart.resize();
	overviewChart.draw();

	zoombar.setRange(ZOOMBAR_GRIP_SIZE, zoombarContainer.offsetWidth - ZOOMBAR_GRIP_SIZE);

	const chartIndex = graphSets.indexOf(set);

	Array.from(selectContainer.childNodes)
		.forEach((child, index) => {
			child.classList.toggle('_active', index === chartIndex);
		});

	title.textContent = `Chart #${chartIndex + 1}`;
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
