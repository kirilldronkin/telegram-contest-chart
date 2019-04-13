import Graph from './graph.js';
import Theme from './theme.js';
import Chart, {Axis, ViewType, TicksType, Options as ChartOptions} from './chart.js';
import Cursor from './cursor.js';
import Zoombar from './ui/zoombar.js';
import Checkbox from './ui/checkbox.js';
import {createDivElement, createCanvasElement, merge} from './utils.js';

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
export const LayoutType = {
	LINE: 'line',
	LINE_DOUBLE: 'line-double',
	BAR: 'bar'
};

/**
 * @type {ChartOptions}
 */
const defaultZoomChartOptions = {
	viewsOptions: {
		line: {
			highlightRadius: 8
		}
	},
	paddingOptions: {
		top: 20,
		bottom: 40
	},
	xTicksOptions: {
		type: TicksType.DATE,
		size: 15
	},
	yTicksOptions: {
		type: TicksType.COMPACT,
		size: 15
	},
	ySecondaryTicksOptions: {
		type: TicksType.COMPACT,
		size: 15
	},
	gridOptions: {
		alpha: 0.5
	},
	rulerOptions: {
		alpha: 0.5
	},
	emptyTextOptions: {
		text: 'No data',
		size: 20
	}
};

/**
 * @type {ChartOptions}
 */
const defaultOverviewChartOptions = {
	paddingOptions: {
		top: 10,
		bottom: 10,
		left: 15,
		right: 15
	},
	xTicksOptions: {
		type: TicksType.NONE
	},
	yTicksOptions: {
		type: TicksType.NONE
	},
	ySecondaryTicksOptions: {
		type: TicksType.NONE
	}
};

export default class Pane {
	/**
	 * @param {string} title
	 * @param {Array<Graph>} graphs
	 * @param {LayoutType} layoutType
	 */
	constructor(title, graphs, layoutType) {
		const zoomChartCanvas = createCanvasElement();
		const zoomChartContainer = createDivElement('pane__zoom-chart');
		const zoomChartOptions = /** @type {ChartOptions} */ (merge({}, defaultZoomChartOptions));

		const overviewChartCanvas = createCanvasElement();
		const overviewChartContainer = createDivElement('pane__overview-chart');
		const overviewChartOptions =/** @type {ChartOptions} */ ( merge({}, defaultOverviewChartOptions));

		const titleElement = createDivElement('pane__title', title);
		const legendElement = createDivElement('pane__legend');

		const zoombarContainer = createDivElement();

		if (layoutType === LayoutType.LINE) {
			zoomChartOptions.viewTypes = [ViewType.LINE];
			overviewChartOptions.viewTypes = [ViewType.LINE];
		}

		if (layoutType === LayoutType.LINE_DOUBLE) {
			zoomChartOptions.viewTypes = [ViewType.LINE, ViewType.LINE];
			zoomChartOptions.ySecondaryViews = [1];

			overviewChartOptions.viewTypes = [ViewType.LINE, ViewType.LINE];
			overviewChartOptions.ySecondaryViews = [1];
		}

		if (layoutType === LayoutType.BAR) {
			zoomChartOptions.viewTypes = [ViewType.BAR];
			zoomChartOptions.yTicksOptions.alpha = 0.5;

			overviewChartOptions.viewTypes = [ViewType.BAR];
			overviewChartOptions.yTicksOptions.alpha = 0.5;
		}

		/**
		 * @type {Array<Graph>}
		 * @private
		 */
		this._graphs = graphs;

		/**
		 * @type {LayoutType}
		 * @private
		 */
		this._layoutType = layoutType;

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._container = createDivElement('pane');

		/**
		 * @type {MediaQueryList}
		 * @private
		 */
		this._mobileMedia = window.matchMedia(MOBILE_MEDIA_QUERY);

		/**
		 * @type {Chart}
		 * @private
		 */
		this._zoomChart = new Chart(zoomChartCanvas, zoomChartOptions);

		/**
		 * @type {Chart}
		 * @private
		 */
		this._overviewChart = new Chart(overviewChartCanvas, overviewChartOptions);

		/**
		 * @type {Cursor}
		 * @private
		 */
		this._cursor = new Cursor();

		/**
		 * @type {Zoombar}
		 * @private
		 */
		this._zoombar = new Zoombar(zoombarContainer);

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._zoombarContainer = zoombarContainer;

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._legend = legendElement;

		zoomChartContainer.appendChild(zoomChartCanvas);

		overviewChartContainer.appendChild(overviewChartCanvas);
		overviewChartContainer.appendChild(zoombarContainer);

		this._container.appendChild(titleElement);
		this._container.appendChild(zoomChartContainer);
		this._container.appendChild(overviewChartContainer);

		this._container.appendChild(this._legend);
	}

	/**
	 * @param {Element} parent
	 * @param {Theme} theme
	 */
	init(parent, theme) {
		this._listenEvents();

		this._graphs.forEach((graph, index) => {
			const checkboxContainer = createDivElement();
			const checkbox = new Checkbox(checkboxContainer, graph.name, graph.color);

			checkbox.setUpdateListener(() => {
				this._toggleGraph(graph, checkbox.isChecked());
			});

			const isLineDoubleLayout = this._layoutType === LayoutType.LINE_DOUBLE;

			this._zoomChart.addGraph(graph, index, isLineDoubleLayout ? index : 0);
			this._overviewChart.addGraph(graph, index, isLineDoubleLayout ? index : 0);

			this._legend.appendChild(checkboxContainer);
		});

		parent.appendChild(this._container);

		this._adjustColors(theme);
		this._adjustForMobile();

		this._zoomChart.resize();
		this._zoomChart.draw();

		this._overviewChart.resize();
		this._overviewChart.draw();

		this._cursor.observe(this._zoomChart);
		this._cursor.resize();

		this._zoombar.resize();
		this._zoombar.setRange(ZOOMBAR_GRIP_SIZE, this._zoombarContainer.offsetWidth - ZOOMBAR_GRIP_SIZE);
	}

	/**
	 * @param {Theme} theme
	 */
	applyTheme(theme) {
		this._adjustColors(theme);
		this._zoomChart.draw();
	}

	/**
	 * @param {Graph} graph
	 * @param {boolean} visible
	 * @private
	 */
	_toggleGraph(graph, visible) {
		const index = this._graphs.indexOf(graph);
		const isLineDoubleLayout = this._layoutType === LayoutType.LINE_DOUBLE;

		if (visible) {
			this._zoomChart.addGraph(graph, index, isLineDoubleLayout ? index : 0);
			this._overviewChart.addGraph(graph, index, isLineDoubleLayout ? index : 0);
		} else {
			this._zoomChart.removeGraph(graph);
			this._overviewChart.removeGraph(graph);
		}

		this._overviewChart.draw();

		const range = this._zoombar.getRange();
		this._zoomChart.setRange(
			this._overviewChart.getXByPixels(range.start),
			this._overviewChart.getXByPixels(range.end)
		);

		this._zoomChart.draw();
	}

	/**
	 * @private
	 */
	_adjustForMobile() {
		this._zoomChart.setTicksCount(Axis.X, this._mobileMedia.matches ? 5 : 7);
		this._zoomChart.setTicksCount(Axis.Y, this._mobileMedia.matches ? 5 : 7);
		this._zoomChart.setTicksCount(Axis.Y_SECONDARY, this._mobileMedia.matches ? 5 : 7);

		this._zoomChart.setViewsOptions({
			line: {
				thickness: this._mobileMedia.matches ? 2 : 3
			}
		});

		this._overviewChart.setViewsOptions({
			line: {
				thickness: this._mobileMedia.matches ? 1 : 2
			}
		});
	}

	/**
	 * @param {Theme} theme
	 * @private
	 */
	_adjustColors(theme) {
		const backgroundColor = {
			[Theme.DAY]: '#ffffff',
			[Theme.NIGHT]: '#232f3d'
		}[theme];

		const textColor = {
			[Theme.DAY]: '#a9b3b9',
			[Theme.NIGHT]: '#4c5f6f'
		}[theme];

		const linesColor = {
			[Theme.DAY]: '#dfe7eb',
			[Theme.NIGHT]: '#394959'
		}[theme];

		this._zoomChart.setTicksColor(Axis.X , textColor);

		if (this._layoutType === LayoutType.LINE_DOUBLE) {
			this._zoomChart.setTicksColor(Axis.Y , this._graphs[0].color);
			this._zoomChart.setTicksColor(Axis.Y_SECONDARY , this._graphs[1].color);
		} else {
			this._zoomChart.setTicksColor(Axis.Y , textColor);
		}

		this._zoomChart.setGridColor(linesColor);
		this._zoomChart.setRulerColor(linesColor);
		this._zoomChart.setEmptyTextColor(textColor);

		this._zoomChart.setViewsOptions({
			line: {
				highlightColor: backgroundColor
			}
		});
	}

	/**
	 * @private
	 */
	_listenEvents() {
		window.addEventListener('resize', this._resize.bind(this));
		window.addEventListener('orientationchange', this._resize.bind(this));

		this._mobileMedia.addListener(() => {
			this._adjustForMobile();
			this._zoom();
		});

		this._zoombar.setUpdateListener(this._zoom.bind(this));
	}

	/**
	 * @private
	 */
	_resize() {
		this._zoomChart.resize();
		this._zoomChart.draw();

		this._overviewChart.resize();
		this._overviewChart.draw();

		this._cursor.resize();

		const range = this._zoomChart.getRange();
		const startPixels = this._overviewChart.getPixelsByX(range.start);
		const endPixels = this._overviewChart.getPixelsByX(range.end);

		this._zoombar.resize();
		this._zoombar.setRange(startPixels, endPixels);
	}

	/**
	 * @private
	 */
	_zoom() {
		const range = this._zoombar.getRange();
		const startX = this._overviewChart.getXByPixels(range.start);
		const endX = this._overviewChart.getXByPixels(range.end);

		this._zoomChart.setRange(startX, endX);

		requestAnimationFrame(() => {
			this._zoomChart.draw();
		});
	}
}
