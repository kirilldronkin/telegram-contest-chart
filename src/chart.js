import Point from './point.js';
import Graph from './graph.js';
import Transition, {Timing} from './transition.js';
import IScale from './interfaces/i-scale.js';
import IView, {Helpers as ViewHelpers} from './interfaces/i-view.js';
import XLinearScale from './scales/x-linear.js';
import YLinearScale from './scales/y-linear.js';
import LineView, {Options as LineViewOptions} from './views/line.js';
import BarView, {Options as BarViewOptions} from './views/bar.js';
import {
	unique,
	pull,
	merge,
	compactNumber,
	formatDate,
	DateUnit,
	hexToRGB
} from './utils.js';

const {min, max} = Math;

/**
 * @const {number}
 */
const GRAPH_FADE_DURATION = 250;

/**
 * @const {number}
 */
const Y_AXIS_SCALE_DURATION = 250;

/**
 * @const {number}
 */
const MAX_TICKS_FORMATTER_CACHE_SIZE = 1000;

/**
 * @enum {string}
 */
export const Axis = {
	X: 'x',
	Y: 'y',
	Y_SECONDARY: 'y-secondary'
};

/**
 * @enum {string}
 */
export const ViewType = {
	LINE: 'line',
	BAR: 'bar',
	AREA: 'area'
};

/**
 * @enum {string}
 */
export const TicksType = {
	NONE: 'none',
	DECIMAL: 'decimal',
	COMPACT: 'compact',
	DATE: 'date'
};

/**
 * @typedef {{
 *     line: (LineViewOptions|undefined),
 *     bar: (BarViewOptions|undefined)
 * }}
 */
let ViewsOptions;

/**
 * @typedef {{
 *     top: number,
 *     right: number,
 *     bottom: number,
 *     left: number
 * }}
 */
let PaddingOptions;

/**
 * @typedef {{
 *     top: (number|undefined),
 *     right: (number|undefined),
 *     bottom: (number|undefined),
 *     left: (number|undefined)
 * }}
 */
let PaddingOptionsPartial;

/**
 * @typedef {{
 *     type: TicksType,
 *     count: number,
 *     color: string,
 *     alpha: number,
 *     size: number,
 *     font: string
 * }}
 */
let XTicksOptions;

/**
 * @typedef {{
 *     type: (TicksType|undefined),
 *     count: (number|undefined),
 *     color: (string|undefined),
 *     alpha: (number|undefined),
 *     size: (number|undefined),
 *     font: (string|undefined)
 * }}
 */
let XTicksOptionsPartial;

/**
 * @typedef {{
 *     type: TicksType,
 *     count: number,
 *     color: string,
 *     alpha: number,
 *     size: number,
 *     font: string,
 *     nice: boolean
 * }}
 */
let YTicksOptions;

/**
 * @typedef {{
 *     type: (TicksType|undefined),
 *     count: (number|undefined),
 *     color: (string|undefined),
 *     alpha: (number|undefined),
 *     size: (number|undefined),
 *     font: (string|undefined),
 *     nice: (boolean|undefined)
 * }}
 */
let YTicksOptionsPartial;

/**
 * @typedef {{
 *     thickness: number,
 *     color: string,
 *     alpha: number
 * }}
 */
let LineOptions;

/**
 * @typedef {{
 *     thickness: (number|undefined),
 *     color: (string|undefined),
 *     alpha: (number|undefined)
 * }}
 */
let LineOptionsPartial;

/**
 * @typedef {{
 *     text: string,
 *     color: string,
 *     size: number,
 *     font: string
 * }}
 */
let EmptyTextOptions;

/**
 * @typedef {{
 *     text: (string|undefined),
 *     color: (string|undefined),
 *     size: (number|undefined),
 *     font: (string|undefined)
 * }}
 */
let EmptyTextOptionsPartial;

/**
 * @typedef {{
 *     viewTypes: (Array<ViewType>|undefined),
 *     viewsOptions: (ViewsOptions|undefined),
 *     paddingOptions: (PaddingOptionsPartial|undefined),
 *     xTicksOptions: (XTicksOptionsPartial|undefined),
 *     yTicksOptions: (YTicksOptionsPartial|undefined),
 *     ySecondaryViews: (Array<number>|undefined),
 *     ySecondaryTicksOptions: (YTicksOptionsPartial|undefined),
 *     gridOptions: (LineOptionsPartial|undefined),
 *     rulerOptions: (LineOptionsPartial|undefined),
 *     emptyTextOptions: (EmptyTextOptionsPartial|undefined)
 * }}
 */
export let Options;

/**
 * @type {ViewsOptions}
 */
const defaultViewsOptions = {
	line: undefined,
	bar: undefined
};

/**
 * @type {PaddingOptions}
 */
const defaultPaddingOptions = {
	top: 0,
	right: 0,
	bottom: 0,
	left: 0
};

/**
 * @type {XTicksOptions}
 */
const defaultXTicksOptions = {
	type: TicksType.DECIMAL,
	count: 10,
	color: '#000000',
	alpha: 1,
	size: 10,
	font: 'Arial, Helvetica, sans-serif'
};

/**
 * @type {YTicksOptions}
 */
const defaultYTicksOptions = {
	type: TicksType.DECIMAL,
	count: 10,
	color: '#000000',
	alpha: 1,
	size: 10,
	font: 'Arial, Helvetica, sans-serif',
	nice: true
};

/**
 * @type {LineOptions}
 */
const defaultLineOptions = {
	thickness: 1,
	color: '#000000',
	alpha: 1
};

/**
 * @type {EmptyTextOptions}
 */
const defaultEmptyTextOptions = {
	text: '',
	color: '#000000',
	size: 10,
	font: 'Arial, Helvetica, sans-serif'
};

export default class Chart {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {Options=} opt
	 */
	constructor(canvas, {
		viewTypes = [],
		viewsOptions = {},
		paddingOptions = {},
		xTicksOptions = {},
		yTicksOptions = {},
		ySecondaryViews = [],
		ySecondaryTicksOptions = {},
		gridOptions = {},
		rulerOptions = {},
		emptyTextOptions = {}
	} = {}) {
		viewsOptions = /** @type {ViewsOptions} */ (merge(defaultViewsOptions, viewsOptions));
		paddingOptions = /** @type {PaddingOptions} */ (merge(defaultPaddingOptions, paddingOptions));
		xTicksOptions = /** @type {XTicksOptions} */ (merge(defaultXTicksOptions, xTicksOptions));
		yTicksOptions = /** @type {YTicksOptions} */ (merge(defaultYTicksOptions, yTicksOptions));
		ySecondaryTicksOptions = /** @type {YTicksOptions} */ (merge(defaultYTicksOptions, ySecondaryTicksOptions));
		gridOptions = /** @type {LineOptions} */ (merge(defaultLineOptions, gridOptions));
		rulerOptions = /** @type {LineOptions} */ (merge(defaultLineOptions, rulerOptions));
		emptyTextOptions = /** @type {EmptyTextOptions} */ (merge(defaultEmptyTextOptions, emptyTextOptions));

		/**
		 * @type {HTMLCanvasElement}
		 * @private
		 */
		this._canvas = canvas;

		/**
		 * @type {CanvasRenderingContext2D}
		 * @private
		 */
		this._context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

		/**
		 * @type {number}
		 * @private
		 */
		this._width = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._height = NaN;

		/**
		 * @type {IScale}
		 * @private
		 */
		this._xScale = new XLinearScale();

		/**
		 * @type {IScale}
		 * @private
		 */
		this._yScale = new YLinearScale({
			nice: yTicksOptions.nice
		});

		/**
		 * @type {?IScale}
		 * @private
		 */
		this._ySecondaryScale = null;

		if (ySecondaryViews.length) {
			this._ySecondaryScale = new YLinearScale({
				nice: ySecondaryTicksOptions.nice
			});
		}

		/**
		 * @type {Array<IView>}
		 * @private
		 */
		this._views = this._createViews(viewTypes, viewsOptions, ySecondaryViews);

		/**
		 * @type {Map<IView, Array<Graph>>}
		 * @private
		 */
		this._viewToGraphs = new Map(this._views.map((view) => [view, []]));

		/**
		 * @type {ViewHelpers}
		 * @private
		 */
		this._viewHelpers = this._createViewHelpers();

		/**
		 * @type {PaddingOptions}
		 * @private
		 */
		this._paddingOptions = paddingOptions;

		/**
		 * @type {Array<Graph>}
		 * @private
		 */
		this._graphs = [];

		/**
		 * @type {Array<Graph>}
		 * @private
		 */
		this._inactiveGraphs = [];

		/**
		 * @type {Map<Graph, IView>}
		 * @private
		 */
		this._graphToView = new Map();

		/**
		 * @type {Map<Graph, Array<Point>>}
		 * @private
		 */
		this._graphToRange = new Map();

		/**
		 * @type {Map<Graph, number>}
		 * @private
		 */
		this._graphToVisibility = new Map();

		/**
		 * @type {Map<Graph, Transition>}
		 * @private
		 */
		this._graphToTransition = new Map();

		/**
		 * @type {Map<Graph, Point>}
		 * @private
		 */
		this._graphToHighlightedPoint = new Map();

		/**
		 * @type {Array<number>}
		 * @private
		 */
		this._xTicks = [];

		/**
		 * @type {XTicksOptions}
		 * @private
		 */
		this._xTicksOptions = xTicksOptions;

		/**
		 * @type {Map<number, number>}
		 * @private
		 */
		this._xTickToVisibility = new Map();

		/**
		 * @type {Array<number>}
		 * @private
		 */
		this._yTicks = [];

		/**
		 * @type {YTicksOptions}
		 * @private
		 */
		this._yTicksOptions = yTicksOptions;

		/**
		 * @type {Map<number, number>}
		 * @private
		 */
		this._yTickToVisibility = new Map();

		/**
		 * @type {Array<number>}
		 * @private
		 */
		this._ySecondaryTicks = [];

		/**
		 * @type {YTicksOptions}
		 * @private
		 */
		this._ySecondaryTicksOptions = ySecondaryTicksOptions;

		/**
		 * @type {Map<number, number>}
		 * @private
		 */
		this._ySecondaryTickToVisibility = new Map();

		/**
		 * @type {LineOptions}
		 * @private
		 */
		this._gridOptions = gridOptions;

		/**
		 * @type {Array<number>}
		 * @private
		 */
		this._rulerXs = [];

		/**
		 * @type {LineOptions}
		 * @private
		 */
		this._rulerOptions = rulerOptions;

		/**
		 * @type {EmptyTextOptions}
		 * @private
		 */
		this._emptyTextOptions = emptyTextOptions;

		/**
		 * @type {TicksFormatter}
		 * @private
		 */
		this._ticksFormatter = new TicksFormatter(MAX_TICKS_FORMATTER_CACHE_SIZE);

		/**
		 * @type {Array<function()>}
		 * @private
		 */
		this._drawListeners = [];

		this._xScale.setTicksCount(xTicksOptions.count);
		this._xScale.setPadding([paddingOptions.left, paddingOptions.right]);

		this._yScale.setTicksCount(yTicksOptions.count);
		this._yScale.setPadding([paddingOptions.top, paddingOptions.bottom]);
		this._yScale.setTransitionDuration(Y_AXIS_SCALE_DURATION);

		this._yScale.setTransitionListeners({
			onStart: this._onYScaleTransitionStart.bind(this, this._yScale),
			onUpdate: this._draw.bind(this),
			onComplete: this._updateYTicks.bind(this, this._yScale)
		});

		if (this._ySecondaryScale) {
			this._ySecondaryScale.setTicksCount(ySecondaryTicksOptions.count);
			this._ySecondaryScale.setPadding([paddingOptions.top, paddingOptions.bottom]);
			this._ySecondaryScale.setTransitionDuration(Y_AXIS_SCALE_DURATION);

			this._ySecondaryScale.setTransitionListeners({
				onStart: this._onYScaleTransitionStart.bind(this, this._ySecondaryScale),
				onUpdate: this._draw.bind(this),
				onComplete: this._updateYTicks.bind(this, this._ySecondaryScale)
			});
		}
	}

	/**
	 * @param {Graph} graph
	 * @param {number=} index
	 * @param {number=} viewIndex
	 */
	addGraph(graph, index = NaN, viewIndex = 0) {
		const view = this._views[viewIndex];
		if (!view) {
			throw new Error(`Unknown view with index ${viewIndex}`);
		}

		const graphView = this._graphToView.get(graph);
		if (graphView && graphView !== view) {
			throw new Error('Graph is already added to another view');
		}

		const viewGraphs = this._viewToGraphs.get(view);
		if (!isNaN(index) && viewGraphs[index] && viewGraphs[index] !== graph) {
			throw new Error(`Index ${index} is already taken`);
		}

		if (!this._graphs.includes(graph)) {
			this._graphs.push(graph);
		}

		if (!this._graphToVisibility.has(graph)) {
			this._graphToVisibility.set(graph, 0);
		}

		if (viewGraphs.includes(graph)) {
			delete viewGraphs[viewGraphs.indexOf(graph)];
		}

		this._graphToView.set(graph, view);
		this._graphToRange.set(graph, this._getGraphRange(graph));

		if (isNaN(index)) {
			viewGraphs.push(graph);
		} else {
			viewGraphs[index] = graph;
		}

		const otherGraphs = this._getActiveGraphs()
			.filter((someGraph) => someGraph !== graph);

		const otherViewGraphs = this._getViewActiveGraphs(view)
			.filter((someGraph) => someGraph !== graph);

		view.addGraphToXScale(graph, otherGraphs, this._viewHelpers);
		view.addGraphToYScale(graph, otherViewGraphs, this._viewHelpers);

		this._stopCurrentGraphTransition(graph);
		this._setupAddingGraphTransition(graph);
	}

	/**
	 * @param {Graph} graph
	 */
	removeGraph(graph) {
		const view = this._graphToView.get(graph);

		const otherGraphs = this._getActiveGraphs()
			.filter((someGraph) => someGraph !== graph);

		const otherViewGraphs = this._getViewActiveGraphs(view)
			.filter((someGraph) => someGraph !== graph);

		view.removeGraphFromXScale(graph, otherGraphs, this._viewHelpers);
		view.removeGraphFromYScale(graph, otherViewGraphs, this._viewHelpers);

		if (this._xScale.isEmpty()) {
			this._clearGraphs();
			this._stopTransitions();

			return;
		}

		this._stopCurrentGraphTransition(graph);
		this._setupRemovingGraphTransition(graph);
	}

	/**
	 * @param {number} start
	 * @param {number} end
	 */
	setRange(start, end) {
		this._xScale.setRangeStart(start);
		this._xScale.setRangeEnd(end);

		this._yScale.setRangeStart(NaN);
		this._yScale.setRangeEnd(NaN);

		if (this._ySecondaryScale) {
			this._ySecondaryScale.setRangeStart(NaN);
			this._ySecondaryScale.setRangeEnd(NaN);
		}

		this._graphs.forEach((graph) => {
			this._graphToRange.set(graph, this._getGraphRange(graph));
		});

		this._views.forEach((view) => {
			view.updateYScaleRange(this._getViewActiveGraphs(view), this._viewHelpers);
		});
	}

	/**
	 * @param {ViewsOptions} options
	 */
	setViewsOptions(options) {
		this._views.forEach((view) => {
			if (view instanceof LineView) {
				view.setOptions(options.line);
			}

			if (view instanceof BarView) {
				view.setOptions(options.bar);
			}
		});
	}

	/**
	 * @param {Axis} axis
	 * @param {number} count
	 */
	setTicksCount(axis, count) {
		if (axis === Axis.X) {
			this._clearXTicks();
			this._xScale.setTicksCount(count);
		}

		if (axis === Axis.Y) {
			this._clearYTicks();
			this._yScale.setTicksCount(count);
		}

		if (axis === Axis.Y_SECONDARY && this._ySecondaryScale) {
			this._clearYSecondaryTicks();
			this._ySecondaryScale.setTicksCount(count);
		}
	}

	/**
	 * @param {Axis} axis
	 * @param {string} color
	 */
	setTicksColor(axis, color) {
		if (axis === Axis.X) {
			this._xTicksOptions.color = color;
		}

		if (axis === Axis.Y) {
			this._yTicksOptions.color = color;
		}

		if (axis === Axis.Y_SECONDARY) {
			this._ySecondaryTicksOptions.color = color;
		}
	}

	/**
	 * @param {string} color
	 */
	setGridColor(color) {
		this._gridOptions.color = color;
	}

	/**
	 * @param {string} color
	 */
	setEmptyTextColor(color) {
		this._emptyTextOptions.color = color;
	}

	/**
	 * @param {string} color
	 */
	setRulerColor(color) {
		this._rulerOptions.color = color;
	}

	/**
	 * @return {HTMLCanvasElement}
	 */
	getCanvas() {
		return this._canvas;
	}

	/**
	 * @return {Array<Graph>}
	 */
	getGraphs() {
		return this._graphs;
	}

	/**
	 * @param {Graph} graph
	 * @return {ViewType}
	 */
	getGraphViewType(graph) {
		if (!this._graphs.includes(graph)) {
			throw new Error('Unknown graph');
		}

		const view = this._graphToView.get(graph);

		if (view instanceof LineView) {
			return ViewType.LINE;
		} else if (view instanceof BarView) {
			return ViewType.BAR;
		}
	}

	/**
	 * @param {Graph} graph
	 * @return {?Point}
	 */
	getGraphHighlightedPoint(graph) {
		return this._graphToHighlightedPoint.get(graph) || null;
	}

	/**
	 * @param {Axis} axis
	 * @return {TicksType}
	 */
	getAxisTicksType(axis) {
		if (axis === Axis.X) {
			return this._xTicksOptions.type;
		}

		if (axis === Axis.Y) {
			return this._yTicksOptions.type;
		}

		if (axis === Axis.Y_SECONDARY) {
			return this._ySecondaryTicksOptions.type;
		}
	}

	/**
	 * @param {Axis} axis
	 * @return {number}
	 */
	getAxisTicksSpacing(axis) {
		if (axis === Axis.X) {
			return this._xScale.getTicksSpacing();
		}

		if (axis === Axis.Y) {
			return this._yScale.getTicksSpacing();
		}

		if (axis === Axis.Y_SECONDARY) {
			return this._ySecondaryScale ? this._ySecondaryScale.getTicksSpacing() : NaN;
		}
	}

	/**
	 * @param {number} pixels
	 * @return {number}
	 */
	getXByPixels(pixels) {
		return this._xScale.getValueByPixels(pixels, {
			fit: true
		});
	}

	/**
	 * @param {number} x
	 * @return {number}
	 */
	getPixelsByX(x) {
		return this._xScale.getPixelsByValue(x, {
			fit: true
		});
	}

	/**
	 * @return {{start: number, end: number}}
	 */
	getRange() {
		const isRangeGiven = this._xScale.isRangeGiven();

		return {
			start: isRangeGiven ?
				this._xScale.getRangeStart() :
				this._xScale.getStart(),

			end: isRangeGiven ?
				this._xScale.getRangeEnd() :
				this._xScale.getEnd()
		};
	}

	/**
	 * @param {number} x
	 */
	addRuler(x) {
		this._rulerXs.push(x);
	}

	removeRulers() {
		this._rulerXs.length = 0;
	}

	/**
	 * @param {function()} listener
	 */
	addDrawListener(listener) {
		if (!this._drawListeners.includes(listener)) {
			this._drawListeners.push(listener);
		}
	}

	/**
	 * @param {function()} listener
	 */
	removeDrawListener(listener) {
		if (this._drawListeners.includes(listener)) {
			pull(this._drawListeners, listener);
		}
	}

	resize() {
		const width = this._canvas.parentNode.offsetWidth;
		const height = this._canvas.parentNode.offsetHeight;

		this._width = width;
		this._height = height;

		this._xScale.setDimension(width);
		this._yScale.setDimension(height);

		if (this._ySecondaryScale) {
			this._ySecondaryScale.setDimension(height);
		}

		const devicePixelRatio = window.devicePixelRatio || 1;
		const backingStoreRatio = (
			this._context.webkitBackingStorePixelRatio ||
			this._context.mozBackingStorePixelRatio ||
			this._context.msBackingStorePixelRatio ||
			this._context.oBackingStorePixelRatio ||
			this._context.backingStorePixelRatio ||
			1
		);

		const ratio = devicePixelRatio / backingStoreRatio;

		if (devicePixelRatio !== backingStoreRatio) {
			this._canvas.width = width * ratio;
			this._canvas.height = height * ratio;
			this._canvas.style.width = `${width}px`;
			this._canvas.style.height = `${height}px`;
		} else {
			this._canvas.width = width;
			this._canvas.height = height;
			this._canvas.style.width = '';
			this._canvas.style.height = '';
		}

		this._context.scale(ratio, ratio);
	}

	/**
	 * @param {number} xPixels
	 */
	highlight(xPixels) {
		this._graphToHighlightedPoint.clear();

		if (isNaN(xPixels)) {
			return;
		}

		this._views.forEach((view) => {
			this._viewToGraphs.get(view)
				.forEach((graph) => {
					const x = this.getXByPixels(xPixels);
					const range = this._getGraphRange(graph);

					const [middle] = graph.getRange(x, x, {
						interpolation: view.getInterpolationType()
					});

					const end = range.find((point) => point.x > middle.x) || middle;
					const start = range[range.indexOf(end) - 1];

					if (start && end) {
						this._graphToHighlightedPoint.set(graph, view.selectHighlightedPoint(start, middle, end));
					}
				});
		});
	}

	draw() {
		this._fitScales();

		this._draw();
		this._drawListeners.forEach((listener) => listener());

		this._startTransitions();
	}

	clear() {
		this._stopTransitions();

		this._clearScales();
		this._clearGraphs();

		this._clearXTicks();
		this._clearYTicks();
		this._clearYSecondaryTicks();

		this._ticksFormatter.clearCache();
	}

	/**
	 * @private
	 */
	_draw() {
		this._context.clearRect(0, 0, this._width, this._height);

		if (this._xScale.isEmpty() || this._xScale.isRangeEmpty()) {
			this._drawEmptyText();

			return;
		}

		this._drawRulers();
		this._drawViews();
		this._drawGrid();
		this._drawXTicks();
		this._drawYTicks();
	}

	/**
	 * @private
	 */
	_drawViews() {
		this._views.forEach((view) => {
			view.draw(this._viewToGraphs.get(view), this._viewHelpers);
		});
	}

	/**
	 * @private
	 */
	_drawRulers() {
		const shouldDraw = this._rulerXs.length > 0;

		if (!shouldDraw) {
			return;
		}

		this._context.save();

		translateXScale(this._context, this._xScale);

		this._context.lineWidth = this._rulerOptions.thickness;
		this._context.strokeStyle = hexToRGB(this._rulerOptions.color, this._rulerOptions.alpha);

		this._rulerXs.forEach((x) => {
			const xPixels = this._xScale.getPixelsByValue(x);

			this._context.beginPath();
			this._context.moveTo(xPixels, this._paddingOptions.top);
			this._context.lineTo(xPixels, this._height - this._paddingOptions.bottom);
			this._context.stroke();
		});

		this._context.restore();
	}

	/**
	 * @private
	 */
	_drawGrid() {
		const shouldDraw = this._yTicksOptions.type !== TicksType.NONE || (
			this._ySecondaryScale && this._ySecondaryTicksOptions.type !== TicksType.NONE
		);

		if (!shouldDraw) {
			return;
		}

		this._context.save();
		this._context.lineWidth = this._gridOptions.thickness;

		if (this._yTicks.length) {
			translateYScale(this._context, this._yScale);

			this._yTicks.forEach((tick) => {
				let yPixels = this._yScale.getPixelsByValue(tick);
				yPixels += (this._gridOptions.thickness / 2);

				const alpha = this._getGridAlpha(tick, Axis.Y);

				this._context.strokeStyle = hexToRGB(this._gridOptions.color, alpha);

				this._context.beginPath();
				this._context.moveTo(0, yPixels);
				this._context.lineTo(this._width, yPixels);
				this._context.stroke();
			});
		} else if (this._ySecondaryScale) {
			translateYScale(this._context, this._ySecondaryScale);

			this._ySecondaryTicks.forEach((tick) => {
				let yPixels = this._ySecondaryScale.getPixelsByValue(tick);
				yPixels += (this._gridOptions.thickness / 2);

				const alpha = this._getGridAlpha(tick, Axis.Y_SECONDARY);

				this._context.strokeStyle = hexToRGB(this._gridOptions.color, alpha);

				this._context.beginPath();
				this._context.moveTo(0, yPixels);
				this._context.lineTo(this._width, yPixels);
				this._context.stroke();
			});
		}

		this._context.restore();
	}

	/**
	 * @private
	 */
	_drawXTicks() {
		const shouldDraw = this._xTicksOptions.type !== TicksType.NONE;

		if (!shouldDraw) {
			return;
		}

		const isStartReached = this._xScale.isStartReached();
		const isEndReached = this._xScale.isEndReached();
		const maxTextWidth = this._xScale.getDimension() / (this._xScale.getTicksCount() * 2);

		this._context.save();

		setFont(this._context, this._xTicksOptions.font, this._xTicksOptions.size);
		translateXScale(this._context, this._xScale);

		if (isStartReached) {
			this._context.textAlign = 'start';
		} else if (isEndReached) {
			this._context.textAlign = 'end';
		} else {
			this._context.textAlign = 'center';
		}

		this._xTicks.forEach((tick) => {
			const xPixels = this._xScale.getPixelsByValue(tick);
			const yPixels = this._height - (this._xTicksOptions.size / 2);

			const text = this._formatTick(tick, Axis.X);
			const alpha = this._getTickAlpha(tick, Axis.X);

			this._context.fillStyle = hexToRGB(this._xTicksOptions.color, alpha);
			this._context.fillText(text, xPixels, yPixels, maxTextWidth);
		});

		this._context.restore();
	}

	/**
	 * @private
	 */
	_drawYTicks() {
		const shouldDraw = this._yTicksOptions.type !== TicksType.NONE || (
			this._ySecondaryScale && this._ySecondaryTicksOptions.type !== TicksType.NONE
		);

		if (!shouldDraw) {
			return;
		}

		if (this._yTicks.length) {
			this._context.save();

			setFont(this._context, this._yTicksOptions.font, this._yTicksOptions.size);
			translateYScale(this._context, this._yScale);

			this._context.textAlign = 'start';

			this._yTicks.forEach((tick) => {
				let yPixels = this._yScale.getPixelsByValue(tick);
				yPixels -= this._yTicksOptions.size / 2;

				const text = this._formatTick(tick, Axis.Y);
				const alpha = this._getTickAlpha(tick, Axis.Y);

				this._context.fillStyle = hexToRGB(this._yTicksOptions.color, alpha);
				this._context.fillText(text, 0, yPixels);
			});

			this._context.restore();
		}

		if (this._ySecondaryScale && this._ySecondaryTicks.length) {
			this._context.save();

			setFont(this._context, this._ySecondaryTicksOptions.font, this._ySecondaryTicksOptions.size);
			translateYScale(this._context, this._ySecondaryScale);

			this._context.textAlign = 'end';

			this._ySecondaryTicks.forEach((tick) => {
				let yPixels = this._ySecondaryScale.getPixelsByValue(tick);
				yPixels -= this._ySecondaryTicksOptions.size / 2;

				const text = this._formatTick(tick, Axis.Y_SECONDARY);
				const alpha = this._getTickAlpha(tick, Axis.Y_SECONDARY);

				this._context.fillStyle = hexToRGB(this._ySecondaryTicksOptions.color, alpha);
				this._context.fillText(text, this._width, yPixels);
			});

			this._context.restore();
		}
	}

	/**
	 * @private
	 */
	_drawEmptyText() {
		const center = [this._width / 2, this._height / 2];

		setFont(this._context, this._emptyTextOptions.font, this._emptyTextOptions.size);

		this._context.textBaseline = 'middle';
		this._context.textAlign = 'center';

		this._context.fillStyle = this._emptyTextOptions.color;
		this._context.fillText(this._emptyTextOptions.text, ...center);
	}

	/**
	 * @private
	 */
	_fitScales() {
		const {isEmpty: isXScaleEmpty, isUpdated: isXScaleUpdated} = fitScaleWithMeta(this._xScale);
		const {isEmpty: isYScaleEmpty, isUpdated: isYScaleUpdated} = fitScaleWithMeta(this._yScale);

		if (isXScaleEmpty) {
			this._clearXTicks();
		} else if (isXScaleUpdated) {
			this._updateXTicks();
		}

		if (isYScaleEmpty) {
			this._clearYTicks();
		} else if (isYScaleUpdated) {
			this._updateYTicks(this._yScale);
		}

		if (this._ySecondaryScale) {
			const {isEmpty, isUpdated} = fitScaleWithMeta(this._ySecondaryScale);

			if (isEmpty) {
				this._clearYSecondaryTicks();
			} else if (isUpdated) {
				this._updateYTicks(this._ySecondaryScale);
			}
		}
	}

	/**
	 * @private
	 */
	_updateXTicks() {
		const scaleStart = this._xScale.getStart();
		const scaleFitStart = this._xScale.getFitStart();
		const scaleFitEnd = this._xScale.getFitEnd();

		const ticksCount = this._xScale.getTicksCount();
		const ticksSpacing = this._xScale.getTicksSpacing();

		const ticksOffset = (scaleStart - scaleFitStart) % ticksSpacing;
		const actualTicksCount = (scaleFitEnd - scaleFitStart) / ticksSpacing;

		this._xTicks.length = 0;
		this._xTicks.push(ticksOffset + scaleFitStart);

		while (this._xTicks[this._xTicks.length - 1] < (ticksOffset + scaleFitEnd)) {
			this._xTicks.push(ticksOffset + scaleFitStart + (this._xTicks.length * ticksSpacing));
		}

		this._xTickToVisibility.clear();

		if (actualTicksCount < ticksCount - 1) {
			this._xTicks.slice()
				.forEach((tick) => {
					const tickIndex = this._xTicks.indexOf(tick);

					const middleTick = tick + (ticksSpacing / 2);
					const middleTickAlpha = (ticksCount - 1) - actualTicksCount;

					if (middleTick < scaleFitEnd) {
						this._xTicks.splice(tickIndex, 1, tick, middleTick);
						this._xTickToVisibility.set(middleTick, middleTickAlpha);
					}
				});
		}
	}

	/**
	 * @param {IScale} scale
	 * @private
	 */
	_updateYTicks(scale) {
		const isPrimary = scale === this._yScale;

		const ticks = isPrimary ? this._yTicks : this._ySecondaryTicks;
		const visibilityMapping = isPrimary ? this._yTickToVisibility : this._ySecondaryTickToVisibility;

		const scaleFitStart = scale.getFitStart();
		const scaleFitEnd = scale.getFitEnd();
		const ticksSpacing = scale.getTicksSpacing();

		ticks.length = 0;
		ticks.push(scaleFitStart);

		while (ticks[ticks.length - 1] < scaleFitEnd) {
			ticks.push(scaleFitStart + (ticks.length * ticksSpacing));
		}

		visibilityMapping.clear();
	}

	/**
	 * @param {IScale} scale
	 * @param {number} fitStart
	 * @param {number} fitEnd
	 * @private
	 */
	_onYScaleTransitionStart(scale, fitStart, fitEnd) {
		const isPrimary = scale === this._yScale;

		const ticks = isPrimary ? this._yTicks : this._ySecondaryTicks;
		const ticksSpacing = scale.getTicksSpacing();
		const visibilityMapping = isPrimary ? this._yTickToVisibility : this._ySecondaryTickToVisibility;

		const oldTicks = ticks.slice();

		const newTicks = [fitStart];
		while (newTicks[newTicks.length - 1] < fitEnd) {
			newTicks.push(fitStart + (newTicks.length * ticksSpacing));
		}

		ticks.length = 0;
		ticks.push(...unique([...oldTicks, ...newTicks]).sort((a, b) => a - b));

		ticks.forEach((tick) => {
			if (visibilityMapping.has(tick)) {
				return;
			}

			if (newTicks.includes(tick)) {
				visibilityMapping.set(tick, 0);
			}

			if (oldTicks.includes(tick)) {
				visibilityMapping.set(tick, 1);
			}
		});

		const initialVisibilityMapping = new Map(visibilityMapping);

		scale.setTransitionListeners({
			onProgress: (progress) => {
				ticks.forEach((tick) => {
					const initialVisibility = initialVisibilityMapping.get(tick);

					if (newTicks.includes(tick)) {
						visibilityMapping.set(tick, min(initialVisibility + progress, 1));
					} else if (oldTicks.includes(tick)) {
						visibilityMapping.set(tick, max(initialVisibility - progress, 0));
					}
				});
			}
		});
	}

	/**
	 * @param {number} tick
	 * @param {Axis} axis
	 * @return {string}
	 * @private
	 */
	_formatTick(tick, axis) {
		/** @type {TicksType} */ let type;
		if (axis === Axis.X) {
			type = this._xTicksOptions.type;
		} else if (axis === Axis.Y) {
			type = this._yTicksOptions.type;
		} else if (axis === Axis.Y_SECONDARY) {
			type = this._ySecondaryTicksOptions.type;
		}

		let scale;
		if (axis === Axis.Y_SECONDARY) {
			if (!this._ySecondaryScale) {
				throw new Error('Y secondary scale is not present');
			}

			scale = this._ySecondaryScale;
		} else {
			scale = axis === Axis.X ? this._xScale : this._yScale;
		}

		return this._ticksFormatter.format(tick, type, scale);
	}

	/**
	 * @param {number} tick
	 * @param {Axis} axis
	 * @return {number}
	 * @private
	 */
	_getGridAlpha(tick, axis) {
		let visibilityMapping;
		if (axis === Axis.Y) {
			visibilityMapping = this._yTickToVisibility;
		} else if (axis === Axis.Y_SECONDARY) {
			visibilityMapping = this._ySecondaryTickToVisibility;
		}

		if (!visibilityMapping) {
			throw new Error(`Wrong axis ${axis}`);
		}

		const visibility = visibilityMapping.has(tick) ? visibilityMapping.get(tick) : 1;

		return visibility * this._gridOptions.alpha;
	}

	/**
	 * @param {number} tick
	 * @param {Axis} axis
	 * @return {number}
	 * @private
	 */
	_getTickAlpha(tick, axis) {
		let visibilityMapping;
		if (axis === Axis.X) {
			visibilityMapping = this._xTickToVisibility;
		} else if (axis === Axis.Y) {
			visibilityMapping = this._yTickToVisibility;
		} else if (axis === Axis.Y_SECONDARY) {
			visibilityMapping = this._ySecondaryTickToVisibility;
		}

		const visibility = visibilityMapping.has(tick) ? visibilityMapping.get(tick) : 1;

		let referenceAlpha;
		if (axis === Axis.X) {
			referenceAlpha = this._xTicksOptions.alpha;
		} else if (axis === Axis.Y) {
			referenceAlpha = this._yTicksOptions.alpha;
		} else if (axis === Axis.Y_SECONDARY) {
			referenceAlpha = this._ySecondaryTicksOptions.alpha;
		}

		return visibility * referenceAlpha;
	}

	/**
	 * @return {Array<Graph>}
	 * @private
	 */
	_getActiveGraphs() {
		return this._graphs.filter((graph) => !this._inactiveGraphs.includes(graph));
	}

	/**
	 * @param {IView} view
	 * @return {Array<Graph>}
	 * @private
	 */
	_getViewActiveGraphs(view) {
		return this._viewToGraphs.get(view)
			.filter((graph) => !this._inactiveGraphs.includes(graph));
	}

	/**
	 * @param {Graph} graph
	 * @return {Array<Point>}
	 * @private
	 */
	_getGraphRange(graph) {
		if (!this._xScale.isRangeGiven()) {
			return graph.points;
		}

		const view = this._graphToView.get(graph);
		const start = this._xScale.getRangeStart();
		const end = this._xScale.getRangeEnd();

		return graph.getRange(start, end, {
			interpolation: view.getInterpolationType()
		});
	}

	/**
	 * @private
	 */
	_startTransitions() {
		this._yScale.startTransition();

		if (this._ySecondaryScale) {
			this._ySecondaryScale.startTransition();
		}

		Array.from(this._graphToTransition.values())
			.forEach((transition) => {
				if (transition.isPending()) {
					transition.start();
				}
			});
	}

	/**
	 * @private
	 */
	_stopTransitions() {
		this._yScale.stopTransition();

		if (this._ySecondaryScale) {
			this._ySecondaryScale.stopTransition();
		}

		Array.from(this._graphToTransition.values())
			.forEach((transition) => {
				if (transition.isActive()) {
					transition.stop();
				}
			});
	}

	/**
	 * @param {Graph} graph
	 * @private
	 */
	_stopCurrentGraphTransition(graph) {
		const currentTransition = this._graphToTransition.get(graph);
		if (currentTransition && currentTransition.isActive()) {
			currentTransition.stop();
		}
	}

	/**
	 * @param {Graph} graph
	 * @private
	 */
	_setupAddingGraphTransition(graph) {
		const view = this._graphToView.get(graph);
		const visibilityInterval = {from: this._graphToVisibility.get(graph), to: 1};

		const transition = new Transition({
			timing: view.getFadeInTransitionTiming(),
			duration: GRAPH_FADE_DURATION,
			intervals: [visibilityInterval],

			onProgress: ([visibility]) => {
				this._graphToVisibility.set(graph, visibility);
			},

			onComplete: () => {
				this._graphToTransition.delete(graph);
			},

			onUpdate: () => {
				this._draw();
			}
		});

		this._graphToTransition.set(graph, transition);
	}

	/**
	 * @param {Graph} graph
	 * @private
	 */
	_setupRemovingGraphTransition(graph) {
		const view = this._graphToView.get(graph);
		const visibilityInterval = {from: this._graphToVisibility.get(graph), to: 0};

		const transition = new Transition({
			timing: view.getFadeOutTransitionTiming(),
			duration: GRAPH_FADE_DURATION,
			intervals: [visibilityInterval],

			onProgress: ([visibility]) => {
				this._graphToVisibility.set(graph, visibility);
			},

			onComplete: () => {
				const view = this._graphToView.get(graph);
				const viewGraphs = this._viewToGraphs.get(view);

				pull(this._graphs, graph);
				pull(this._inactiveGraphs, graph);

				this._graphToView.delete(graph);
				this._graphToRange.delete(graph);
				this._graphToVisibility.delete(graph);
				this._graphToTransition.delete(graph);
				this._graphToHighlightedPoint.delete(graph);

				delete viewGraphs[viewGraphs.indexOf(graph)];
			},

			onUpdate: () => {
				this._draw();
			},

			onCancel: () => {
				pull(this._inactiveGraphs, graph);
			}
		});

		this._inactiveGraphs.push(graph);
		this._graphToTransition.set(graph, transition);
	}

	/**
	 * @private
	 */
	_clearScales() {
		this._xScale.clear();
		this._yScale.clear();

		if (this._ySecondaryScale) {
			this._ySecondaryScale.clear();
		}
	}

	/**
	 * @private
	 */
	_clearGraphs() {
		this._graphs.length = 0;
		this._inactiveGraphs.length = 0;

		this._graphToView.clear();
		this._graphToRange.clear();
		this._graphToVisibility.clear();
		this._graphToTransition.clear();
		this._graphToHighlightedPoint.clear();

		Array.from(this._viewToGraphs.values())
			.forEach((graphs) => {
				graphs.length = 0;
			});
	}

	/**
	 * @private
	 */
	_clearXTicks() {
		this._xTicks.length = 0;
		this._xTickToVisibility.clear();
	}

	/**
	 * @private
	 */
	_clearYTicks() {
		this._yTicks.length = 0;
		this._yTickToVisibility.clear();
	}

	/**
	 * @private
	 */
	_clearYSecondaryTicks() {
		this._ySecondaryTicks.length = 0;
		this._ySecondaryTickToVisibility.clear();
	}

	/**
	 * @param {Array<ViewType>} types
	 * @param {ViewsOptions} options
	 * @param {Array<number>} ySecondary
	 * @return {Array<IView>}
	 * @private
	 */
	_createViews(types, options, ySecondary) {
		return types.map((type, index) => {
			const yScale = ySecondary.includes(index) ? this._ySecondaryScale : this._yScale;

			switch (type) {
				case ViewType.LINE:
					return new LineView(this._context, this._xScale, yScale, options.line);

				case ViewType.BAR:
					return new BarView(this._context, this._xScale, yScale, options.bar);

				default:
					throw new Error(`Unsupported view type ${type}`);
			}
		});
	}

	/**
	 * @return {ViewHelpers}
	 * @private
	 */
	_createViewHelpers() {
		return {
			getGraphRange: (graph) => this._graphToRange.get(graph),
			getGraphVisibility: (graph) => this._graphToVisibility.get(graph),
			getGraphHighlightedPoint: (graph) => this._graphToHighlightedPoint.get(graph) || null
		};
	}
}

class TicksFormatter {
	/**
	 * @param {number} maxCacheSize
	 */
	constructor(maxCacheSize) {
		/**
		 * @type {number}
		 * @private
		 */
		this._maxCacheSize = maxCacheSize;

		/**
		 * @type {Map<number, string>}
		 * @private
		 */
		this._compactCache = new Map();

		/**
		 * @type {Map<DateUnit, Map<number, string>>}
		 * @private
		 */
		this._dateCache = new Map();

		Object.values(DateUnit)
			.forEach((unit) => {
				this._dateCache.set(unit, new Map());
			});
	}

	/**
	 * @param {number} tick
	 * @param {TicksType} type
	 * @param {IScale} scale
	 * @return {string}
	 */
	format(tick, type, scale) {
		let formatted;

		switch (type) {
			case TicksType.DATE:
				const ticksSpacing = scale.getTicksSpacing();

				const msInSecond = 1000;
				const msInMinute = msInSecond * 60;
				const msInHour = msInMinute * 60;
				const msInDay = msInHour * 24;
				const msInMonth = msInDay * 30;
				const msInYear = msInMonth * 12;

				/** @type {DateUnit} */ let unit;
				if (ticksSpacing / msInYear >= 1) {
					unit = DateUnit.YEAR;
				} else if (ticksSpacing / msInMonth >= 1) {
					unit = DateUnit.MONTH;
				} else if (ticksSpacing / msInDay >= 1) {
					unit = DateUnit.DAY;
				} else if (ticksSpacing / msInHour >= 1) {
					unit = DateUnit.HOUR;
				} else if (ticksSpacing / msInMinute >= 1) {
					unit = DateUnit.MINUTE;
				} else if (ticksSpacing / msInSecond >= 1) {
					unit = DateUnit.SECOND;
				}

				const unitBucket = this._dateCache.get(unit);
				if (unitBucket.has(tick)) {
					formatted = unitBucket.get(tick);
				} else {
					formatted = formatDate(new Date(tick), unit);

					if (unitBucket.size === this._maxCacheSize) {
						unitBucket.clear();
					}

					unitBucket.set(tick, formatted);
				}

				break;

			case TicksType.COMPACT:
				if (this._compactCache.has(tick)) {
					formatted = this._compactCache.get(tick);
				} else {
					formatted = compactNumber(tick);

					if (this._compactCache.size === this._maxCacheSize) {
						this._compactCache.clear();
					}

					this._compactCache.set(tick, formatted);
				}

				break;

			default:
				formatted = String(tick);

				break;
		}

		return formatted;
	}

	clearCache() {
		this._compactCache.clear();

		Array.from(this._dateCache.values())
			.forEach((unitBucket) => {
				unitBucket.clear();
			});
	}
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {string} family
 * @param {number} size
 */
function setFont(context, family, size) {
	const font = `${size}px ${family}`;

	if (context.font !== font) {
		context.font = font;
	}
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {IScale} scale
 */
function translateXScale(context, scale) {
	context.translate(scale.getPixelsPerValue() * scale.getFitStart() * -1, 0);
}

/**
 * @param {CanvasRenderingContext2D} context
 * @param {IScale} scale
 */
function translateYScale(context, scale) {
	context.translate(0, scale.getPixelsPerValue() * scale.getFitStart());
}

/**
 * @param {IScale} scale
 * @return {{
 *     isEmpty: boolean,
 *     isUpdated: boolean
 * }}
 */
function fitScaleWithMeta(scale) {
	const oldFitStart = scale.getFitStart();
	const oldFitEnd = scale.getFitEnd();

	scale.fit();

	const fitStart = scale.getFitStart();
	const fitEnd = scale.getFitEnd();

	const isEmpty = isNaN(fitStart) || isNaN(fitEnd);
	const isUpdated = fitStart !== oldFitStart || fitEnd !== oldFitEnd;

	return {
		isEmpty,
		isUpdated
	};
}
