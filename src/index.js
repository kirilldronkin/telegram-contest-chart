import Point from './point.js';
import Graph from './graph.js';
import Chart, {Axis, ViewType, TicksType} from './chart.js';
import Cursor from './cursor.js';
import {createDivElement} from './utils.js';
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
 * @const {number}
 */
const SCROLLING_STATE_TIME = 500;

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
	viewTypes: [ViewType.LINE],
	viewsOptions: {
		line: {
			thickness: mobileMedia.matches ? 2 : 3,
			highlightRadius: 8
		}
	},
	xTicksOptions: {
		type: TicksType.DATE,
		count: mobileMedia.matches ? 5 : 7,
		size: 15
	},
	yTicksOptions: {
		type: TicksType.COMPACT,
		count: mobileMedia.matches ? 5 : 7,
		size: 15
	},
	ySecondaryViews: [1],
	ySecondaryTicksOptions: {
		type: TicksType.COMPACT,
		count: mobileMedia.matches ? 5 : 7,
		size: 15
	},
	paddingOptions: {
		top: 30,
		bottom: 40
	},
	gridOptions: {
		text: 'No data',
		alpha: 0.5
	},
	emptyTextOptions: {
		text: 'No data',
		size: 20
	},
	rulerOptions: {
		alpha: 0.5
	}
});

const overviewChartCanvas = /** @type {HTMLCanvasElement} */ (document.querySelector('#overview-chart-canvas'));
const overviewChart = new Chart(overviewChartCanvas, {
	viewTypes: [ViewType.LINE],
	viewsOptions: {
		line: {
			thickness: mobileMedia.matches ? 1 : 2
		}
	},
	xTicksOptions: {
		type: TicksType.NONE
	},
	yTicksOptions: {
		type: TicksType.NONE
	},
	paddingOptions: {
		top: 10,
		bottom: 10,
		left: 15,
		right: 15
	}
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
			zoombar.setUpdateListener(zoom);

			themeSwitchButton.addEventListener('click', () => {
				selectTheme(currentTheme === Theme.DAY ? Theme.NIGHT : Theme.DAY);
			});

			mobileMedia.addListener(() => {
				zoomChart.setTicksCount(Axis.X, mobileMedia.matches ? 5 : 7);
				zoomChart.setTicksCount(Axis.Y, mobileMedia.matches ? 5 : 7);
				zoomChart.setTicksCount(Axis.Y_SECONDARY, mobileMedia.matches ? 5 : 7);

				zoomChart.setViewsOptions({
					line: {
						thickness: mobileMedia.matches ? 2 : 3
					}
				});

				overviewChart.setViewsOptions({
					line: {
						thickness: mobileMedia.matches ? 1 : 2
					}
				});

				resize();
			});

			window.addEventListener('resize', resize);
			window.addEventListener('orientationchange', resize);

			let timer;
			window.addEventListener('scroll', function() {
				clearTimeout(timer);

				if(!document.body.classList.contains('_scrolling')) {
					document.body.classList.add('_scrolling');
				}

				timer = setTimeout(function(){
					document.body.classList.remove('_scrolling');
				}, SCROLLING_STATE_TIME);
			}, false);

			graphSets.forEach((set) => {
				const container = createDivElement('select__chart');
				const canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));

				const chart = new Chart(canvas, {
					viewTypes: [ViewType.LINE],
					viewsOptions: {
						line: {
							thickness: 1
						}
					},
					xTicksOptions: {
						type: TicksType.NONE
					},
					yTicksOptions: {
						type: TicksType.NONE
					},
					paddingOptions: {
						top: 5,
						bottom: 5,
						left: 5,
						right: 5
					}
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

			cursor.observe(zoomChart);
			cursor.resize();

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

	Object.values(Axis)
		.forEach((axis) => {
			zoomChart.setTicksColor(axis , {
				[Theme.DAY]: '#dfe7eb',
				[Theme.NIGHT]: '#394959'
			}[theme]);
		});

	zoomChart.setGridColor({
		[Theme.DAY]: '#dfe7eb',
		[Theme.NIGHT]: '#394959'
	}[theme]);

	zoomChart.setRulerColor({
		[Theme.DAY]: '#dfe7eb',
		[Theme.NIGHT]: '#394959'
	}[theme]);

	zoomChart.setEmptyTextColor({
		[Theme.DAY]: '#a9b3b9',
		[Theme.NIGHT]: '#4c5f6f'
	}[theme]);

	zoomChart.setViewsOptions({
		line: {
			highlightColor: {
				[Theme.DAY]: '#ffffff',
				[Theme.NIGHT]: '#232f3d'
			}[theme]
		}
	});

	zoomChart.draw();
}

/**
 * @param {Array<Graph>} set
 */
function selectGraphSet(set) {
	zoomChart.clear();
	overviewChart.clear();

	while (legendContainer.lastChild) {
		legendContainer.removeChild(legendContainer.lastChild);
	}

	set.forEach((graph, index) => {
		const checkboxContainer = createDivElement();
		const checkbox = new Checkbox(checkboxContainer, graph.name, graph.color);

		checkbox.setUpdateListener(() => {
			if (checkbox.isChecked()) {
				zoomChart.addGraph(graph, index);
				overviewChart.addGraph(graph, index);
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

		zoomChart.addGraph(graph, index);
		overviewChart.addGraph(graph, index);

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

	cursor.resize();

	const range = zoomChart.getRange();
	const startPixels = overviewChart.getPixelsByX(range.start);
	const endPixels = overviewChart.getPixelsByX(range.end);

	zoombar.resize();
	zoombar.setRange(startPixels, endPixels);
}

function zoom() {
	const range = zoombar.getRange();
	const startX = overviewChart.getXByPixels(range.start);
	const endX = overviewChart.getXByPixels(range.end);

	zoomChart.setRange(startX, endX);

	requestAnimationFrame(() => {
		zoomChart.draw();
	});
}
