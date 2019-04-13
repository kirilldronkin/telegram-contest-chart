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
const SCROLLING_STATE_TIME = 300;

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

document.body.classList.add(`_${currentTheme}`);
themeSwitchButton.textContent = {
	[Theme.DAY]: 'Switch to Night Mode',
	[Theme.NIGHT]: 'Switch to Day Mode'
}[currentTheme];

window.addEventListener('load', onLoad);

/**
 * @return {Promise<Object>}
 */
async function loadDatasets() {
	return Promise.all(
		['1', '2', '3', '4'].map((sample) =>
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
				values.map((value, index) => new Point(xs[index], value)))
		);

		let /** @type {string} */ title;
		if (datasetIndex === 0) {
			title = 'Followers';
		} else if (datasetIndex === 1) {
			title = 'Interactions';
		} else if (datasetIndex === 2) {
			title = 'Messages';
		} else if (datasetIndex === 3) {
			title = 'Apps';
		}

		let /** @type {PaneLayoutType} */ layout;
		if (datasetIndex === 0) {
			layout = PaneLayoutType.LINE;
		} else if (datasetIndex === 1) {
			layout = PaneLayoutType.LINE_DOUBLE
		} else if (datasetIndex === 2 || datasetIndex === 3) {
			layout = PaneLayoutType.BAR;
		}

		const pane = new Pane(title, graphs, layout);

		pane.init(panesContainer, currentTheme);

		panes.push(pane);
	});
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
