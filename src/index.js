import Point from './point.js';
import Graph from './graph.js';
import Theme from './theme.js';
import Pane, {LayoutType as PaneLayoutType} from './pane.js';

/**
 * @const {string}
 */
const THEME_STORAGE_KEY = 'telegram-contest-chart_theme';

/**
 * @const {number}
 */
const SCROLLING_STATE_TIME = 500;

/**
 * @type {number}
 */
const PANE_DRAW_CHARTS_DELAY = 250;

const panes = [];
const panesContainer = document.querySelector('#panes');
const themeSwitchButton = document.querySelector('#theme-switch-button');

let currentTheme = /** @type {Theme} */ (window.localStorage.getItem(THEME_STORAGE_KEY) || Theme.DAY);

let scrollStateTimer;
window.addEventListener('scroll', () => {
	clearTimeout(scrollStateTimer);

	if (!document.body.classList.contains('_scrolling')) {
		document.body.classList.add('_scrolling');
	}

	scrollStateTimer = setTimeout(() => {
		document.body.classList.remove('_scrolling');
	}, SCROLLING_STATE_TIME);
}, false);

themeSwitchButton.addEventListener('click', toggleTheme);
themeSwitchButton.textContent = {
	[Theme.DAY]: 'Switch to Night Mode',
	[Theme.NIGHT]: 'Switch to Day Mode'
}[currentTheme];

window.addEventListener('load', onLoad);

/**
 * @return {Promise<Object>}
 */
function loadDatasets() {
	return Promise.all(
		['1', '2', '3', '4', '5'].map((sample) =>
			fetch(`data/${sample}/overview.json`).then((response) => response.json())
		)
	);
}

async function onLoad() {
	const datasets = await loadDatasets();

	datasets.forEach((dataset, datasetIndex) => {
		const xs = dataset['columns'].find((values) => values[0] === 'x').slice(1);
		const ys = dataset['columns'].filter((values) => values[0].startsWith('y'));

		const graphs = ys.map(([name, ...values]) =>
			new Graph(
				dataset['names'][name],
				dataset['colors'][name],
				values.map((value, index) => new Point(xs[index], value))
			)
		);

		let /** @type {string} */ title;
		if (datasetIndex === 0) {
			title = 'Line';
		} else if (datasetIndex === 1) {
			title = 'Dual Axis Line';
		} else if (datasetIndex === 2) {
			title = 'Stacked Bar';
		} else if (datasetIndex === 3) {
			title = 'Bar';
		} else if (datasetIndex === 4) {
			title = 'Stacked Area';
		}

		let /** @type {PaneLayoutType} */ layout;
		if (datasetIndex === 0) {
			layout = PaneLayoutType.LINE;
		} else if (datasetIndex === 1) {
			layout = PaneLayoutType.LINE_DOUBLE
		} else if (datasetIndex === 2 || datasetIndex === 3) {
			layout = PaneLayoutType.BAR;
		} else if (datasetIndex === 4) {
			layout = PaneLayoutType.AREA;
		}

		const pane = new Pane(title, graphs, layout);

		panes.push(pane);
		pane.init(panesContainer, currentTheme);

		setTimeout(() => pane.drawCharts(), datasetIndex * PANE_DRAW_CHARTS_DELAY);
	});

	document.body.classList.remove(`_loading`);
}

function toggleTheme() {
	const newTheme = currentTheme === Theme.DAY ? Theme.NIGHT : Theme.DAY;

	document.body.classList.remove(`_${currentTheme}`);
	document.body.classList.add(`_${newTheme}`);

	window.localStorage.setItem(THEME_STORAGE_KEY, currentTheme = newTheme);

	panes.forEach((pane) => pane.applyTheme(newTheme));

	themeSwitchButton.textContent = {
		[Theme.DAY]: 'Switch to Night Mode',
		[Theme.NIGHT]: 'Switch to Day Mode'
	}[newTheme];
}
