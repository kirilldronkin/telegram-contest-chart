import Theme from './theme.js';
import Graph from './graph.js';
import Chart, {Axis, ViewType, TicksType, Options as ChartOptions} from './chart.js';
import Cursor from './cursor.js';
import Zoombar from './ui/zoombar.js';
import Checkbox from './ui/checkbox.js';
import {createDivElement, merge, throttle, debounce, formatDay, getShortWeekDayName} from './utils.js';

/**
 * @const {string}
 */
const MOBILE_MEDIA_QUERY = 'only screen and (max-width: 480px) and (orientation: portrait)';

/**
 * @const {number}
 */
const RANGE_RENDER_BACKPRESSURE_TIME = 100;

/**
 * @enum {string}
 */
export const LayoutType = {
	LINE: 'line',
	LINE_DOUBLE: 'line-double',
	BAR: 'bar',
	AREA: 'area'
};

/**
 * @type {ChartOptions}
 */
const commonZoomChartOptions = {
	viewsOptions: {
		line: {
			highlightRadius: 5
		},
		bar: {
			highlightDimmingAlpha: 0.5
		}
	},
	viewsPadding: {
		top: 15,
		bottom: 25
	},
	viewportPadding: {
		left: 10,
		right: 10
	},
	xTicks: {
		type: TicksType.DATE,
		size: 11
	},
	yTicks: {
		type: TicksType.COMPACT,
		count: 6,
		size: 11
	},
	ySecondaryTicks: {
		type: TicksType.COMPACT,
		count: 6,
		size: 11
	},
	grid: {
		alpha: 0.1
	},
	ruler: {
		alpha: 0.1
	},
	emptyText: {
		text: 'Nothing to show',
		size: 12
	}
};

/**
 * @type {ChartOptions}
 */
const commonOverviewChartOptions = {
	viewsPadding: {
		top: 2,
		bottom: 2,
		left: 10,
		right: 10
	},
	xTicks: {
		type: TicksType.NONE
	},
	yTicks: {
		type: TicksType.NONE
	},
	ySecondaryTicks: {
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
		const zoomChartContainer = createDivElement('pane__zoom-chart');
		const zoomChartOptions = /** @type {ChartOptions} */ (merge({}, commonZoomChartOptions));
		const zoomChartCanvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));

		const overviewChartContainer = createDivElement('pane__overview-chart');
		const overviewChartOptions =/** @type {ChartOptions} */ ( merge({}, commonOverviewChartOptions));
		const overviewChartCanvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));

		const headerElement = createDivElement('pane__header');
		const titleElement = createDivElement('pane__title', title);
		const zoomRangeElement = createDivElement('pane__range');
		const legendElement = createDivElement('pane__legend');

		const zoombarContainer = createDivElement();

		if (layoutType === LayoutType.LINE) {
			zoomChartOptions.views = [{type: ViewType.LINE}];
			overviewChartOptions.views = [{type: ViewType.LINE}];
		}

		if (layoutType === LayoutType.LINE_DOUBLE) {
			zoomChartOptions.views = [{type: ViewType.LINE}, {type: ViewType.LINE, ySecondary: true}];
			overviewChartOptions.views = [{type: ViewType.LINE}, {type: ViewType.LINE, ySecondary: true}];
		}

		if (layoutType === LayoutType.BAR) {
			zoomChartOptions.views = [{type: ViewType.BAR}];
			overviewChartOptions.views = [{type: ViewType.BAR}];
		}

		if (layoutType === LayoutType.AREA) {
			zoomChartOptions.views = [{type: ViewType.AREA}];
			overviewChartOptions.views = [{type: ViewType.AREA}];
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
		this._zoomRangeElement = zoomRangeElement;

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._legendElement = legendElement;

		/**
		 * @type {function()}
		 * @private
		 */
		this._renderZoomRangeThrottled = throttle(this._renderZoomRange.bind(this), RANGE_RENDER_BACKPRESSURE_TIME);

		/**
		 * @type {function()}
		 * @private
		 */
		this._renderZoomRangeDebounced = debounce(this._renderZoomRange.bind(this), RANGE_RENDER_BACKPRESSURE_TIME);

		zoomChartContainer.appendChild(zoomChartCanvas);

		overviewChartContainer.appendChild(overviewChartCanvas);
		overviewChartContainer.appendChild(zoombarContainer);

		headerElement.appendChild(titleElement);
		headerElement.appendChild(zoomRangeElement);

		this._container.appendChild(headerElement);
		this._container.appendChild(zoomChartContainer);
		this._container.appendChild(overviewChartContainer);

		this._container.appendChild(this._legendElement);
	}

	/**
	 * @param {Element} parent
	 * @param {Theme} theme
	 */
	init(parent, theme) {
		parent.appendChild(this._container);

		this._graphs.forEach((graph, index) => {
			const isLineDoubleLayout = this._layoutType === LayoutType.LINE_DOUBLE;

			this._zoomChart.addGraph(graph, index, isLineDoubleLayout ? index : 0);
			this._overviewChart.addGraph(graph, index, isLineDoubleLayout ? index : 0);
		});

		this._cursor.observe(this._zoomChart);

		this._zoomChart.resize();
		this._overviewChart.resize();
		this._cursor.resize();
		this._zoombar.resize();

		let rangeStart = NaN;
		let rangeEnd = NaN;

		const firstGraph = this._graphs[0];

		for (let i = firstGraph.points.length - 1; i !== 0; i--) {
			const point = firstGraph.points[i];
			const pointDate = new Date(point.x);

			if (isNaN(rangeEnd)) {
				rangeEnd = point.x;
			}

			if (i === 0) {
				rangeStart = point.x;
				break;
			}

			const rangeEndDate = new Date(rangeEnd);

			if (
				pointDate.getDate() === rangeEndDate.getDate() &&
				pointDate.getMonth() !== rangeEndDate.getMonth()
			) {
				rangeStart = point.x;
				break;
			}
		}

		this._overviewChart.fit();

		this._zoomChart.setRange(rangeStart, rangeEnd);
		this._zoomChart.fit();

		const rangeStartPixels = this._overviewChart.getPixelsByX(rangeStart);
		const rangeEndPixels = this._overviewChart.getPixelsByX(rangeEnd);

		this._zoombar.setRange(rangeStartPixels, rangeEndPixels);

		this._adjustColors(theme);
		this._adjustForMobile();

		this._renderLegend();
		this._renderZoomRange();

		this._listenEvents();
	}

	drawCharts() {
		this._zoomChart.draw();
		this._overviewChart.draw();
	}

	/**
	 * @param {Theme} theme
	 */
	applyTheme(theme) {
		this._adjustColors(theme);
		this._zoomChart.draw();
	}

	/**
	 * @param {{
	 *     show: (Array<Graph>|undefined),
	 *     hide: (Array<Graph>|undefined)
	 * }} opt
	 * @private
	 */
	_toggleGraphs({show = [], hide = []} = {}) {
		const isLineDoubleLayout = this._layoutType === LayoutType.LINE_DOUBLE;

		show.forEach((graph) => {
			const index = this._graphs.indexOf(graph);

			this._zoomChart.addGraph(graph, index, isLineDoubleLayout ? index % 2 : 0);
			this._overviewChart.addGraph(graph, index, isLineDoubleLayout ? index % 2 : 0);
		});

		hide.forEach((graph) => {
			this._zoomChart.removeGraph(graph);
			this._overviewChart.removeGraph(graph);
		});

		this._overviewChart.draw();

		const range = this._zoombar.getRange();
		this._zoomChart.setRange(
			this._overviewChart.getXByPixels(range.start),
			this._overviewChart.getXByPixels(range.end)
		);

		this._zoomChart.draw();

		this._renderZoomRange();
	}

	/**
	 * @private
	 */
	_adjustForMobile() {
		this._zoomChart.setTicksCount(Axis.X, this._mobileMedia.matches ? 6 : 8);

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
		let xTicksColor;
		let xTicksAlpha;

		let yTicksColor;
		let yTicksAlpha;

		let ySecondaryTicksColor;
		let ySecondaryTicksAlpha;

		if (this._layoutType === LayoutType.LINE) {
			if (theme === Theme.DAY) {
				xTicksColor = yTicksColor = '#8e8e93';
				xTicksAlpha = yTicksAlpha = 1;
			}

			if (theme === Theme.NIGHT) {
				xTicksColor = yTicksColor = '#a3b1c2';
				xTicksAlpha = yTicksAlpha = 0.6;
			}
		}

		if (this._layoutType === LayoutType.LINE_DOUBLE) {
			if (theme === Theme.DAY) {
				xTicksColor = '#8e8e93';
				xTicksAlpha = 1;
			}

			if (theme === Theme.NIGHT) {
				xTicksColor = '#a3b1c2';
				xTicksAlpha = 0.6;
			}

			yTicksColor = this._graphs[0].color;
			yTicksAlpha = 1;

			ySecondaryTicksColor = this._graphs[1].color;
			ySecondaryTicksAlpha = 1;
		}

		if (this._layoutType === LayoutType.BAR || this._layoutType === LayoutType.AREA) {
			if (theme === Theme.DAY) {
				xTicksColor = yTicksColor = '#252529';
				xTicksAlpha = yTicksAlpha = 0.5;
			}

			if (theme === Theme.NIGHT) {
				xTicksColor = '#a3b1c2';
				xTicksAlpha = 0.6;

				yTicksColor = '#ecf2f8';
				yTicksAlpha = 0.5;
			}
		}

		if (xTicksColor) {
			this._zoomChart.setTicksColor(Axis.X , xTicksColor);
		}

		if (xTicksAlpha) {
			this._zoomChart.setTicksAlpha(Axis.X , xTicksAlpha);
		}

		if (yTicksColor) {
			this._zoomChart.setTicksColor(Axis.Y , yTicksColor);
		}

		if (yTicksAlpha) {
			this._zoomChart.setTicksAlpha(Axis.Y , yTicksAlpha);
		}

		if (ySecondaryTicksColor) {
			this._zoomChart.setTicksColor(Axis.Y_SECONDARY , ySecondaryTicksColor);
		}

		if (ySecondaryTicksAlpha) {
			this._zoomChart.setTicksAlpha(Axis.Y_SECONDARY , ySecondaryTicksAlpha);
		}

		this._zoomChart.setGridColor({
			[Theme.DAY]: '#182d3b',
			[Theme.NIGHT]: '#ffffff'
		}[theme]);

		this._zoomChart.setRulerColor({
			[Theme.DAY]: '#182d3b',
			[Theme.NIGHT]: '#ffffff'
		}[theme]);

		this._zoomChart.setEmptyTextColor({
			[Theme.DAY]: '#000000',
			[Theme.NIGHT]: '#ffffff'
		}[theme]);

		this._zoomChart.setViewsOptions({
			line: {
				highlightColor: {
					[Theme.DAY]: '#ffffff',
					[Theme.NIGHT]: '#242f3e'
				}[theme]
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

		this._zoombar.setRangeChangeListener(this._zoom.bind(this));
	}

	/**
	 * @private
	 */
	_renderLegend() {
		const checkboxes = [];

		this._graphs.forEach((graph, index) => {
			const checkboxContainer = createDivElement();
			const checkbox = new Checkbox(checkboxContainer, graph.name, graph.color);

			checkboxes.push(checkbox);

			checkbox.setCheckedStateChangeListener(() => {
				this._toggleGraphs({
					show: checkbox.isChecked() ? [graph] : [],
					hide: checkbox.isChecked() ? [] : [graph]
				});
			});

			checkbox.setLongTapListener(() => {
				const shownGraphs = this._overviewChart.getGraphs();
				const otherShownGraphs = this._graphs.filter((someGraph) =>
					shownGraphs.includes(someGraph) && someGraph !== graph
				);

				this._toggleGraphs({
					show: shownGraphs.includes(graph) ? [] : [graph],
					hide: otherShownGraphs
				});

				checkboxes.forEach((checkbox, checkboxIndex) => {
					checkbox.setCheckedState(checkboxIndex === index);
				});
			});

			this._legendElement.appendChild(checkboxContainer);
		});
	}

	/**
	 * @private
	 */
	_renderZoomRange() {
		const range = this._zoomChart.getRange();

		if (isNaN(range.start) || isNaN(range.end) || range.start === range.end) {
			this._zoomRangeElement.textContent = '';

			return;
		}

		const startDate = new Date(range.start);
		const startText = formatDay(startDate);

		const endDate = new Date(range.end);
		const endText = formatDay(endDate);

		let rangeText;
		if (startText === endText) {
			rangeText = `${getShortWeekDayName(startDate.getDay())}, ${startText}`;
		} else {
			rangeText = `${startText} - ${endText}`;
		}

		this._zoomRangeElement.textContent = rangeText;
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

		this._renderZoomRangeThrottled();
		this._renderZoomRangeDebounced();

		requestAnimationFrame(() => {
			this._zoomChart.draw();
		});
	}
}
