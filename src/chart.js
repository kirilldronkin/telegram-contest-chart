import Graph from './graph.js';
import Point from './point.js';
import Transition, {Timing} from './transition.js';
import {
	identity,
	clamp,
	findMax,
	findMin,
	niceNumber,
	compactNumber,
	formatDate,
	hexToRGB
} from './utils.js';

const {ceil, floor, min} = Math;

/**
 * @const {number}
 */
const TRANSITION_DURATION = 350;

/**
 * @const {string}
 */
const NO_DATA_TEXT_FONT = '20px Arial, Helvetica, Verdana, sans-serif';

/**
 * @const {string}
 */
const TICK_FONT = '15px Arial, Helvetica, Verdana, sans-serif';

/**
 * @const {number}
 */
const TICK_TEXT_BOTTOM_MARGIN = 10;

/**
 * @const {number}
 */
const TICK_LINE_THICKNESS = 1;

/**
 * @enum {string}
 */
export const Axis = {
	X: 'x',
	Y: 'y'
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
 * @enum {string}
 */
export const TicksScale = {
	EXTREMUM: 'extremum',
	NICE: 'nice'
};

export default class Chart {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {{
	 *     xTicksType: (TicksType|undefined),
	 *     xTicksBackground: (boolean|undefined),
	 *     yTicksType: (TicksType|undefined),
	 *     yTicksScale: (TicksScale|undefined),
	 *     yTicksBackground: (boolean|undefined),
	 *     topPadding: (number|undefined),
	 *     bottomPadding: (number|undefined),
	 *     leftPadding: (number|undefined),
	 *     rightPadding: (number|undefined),
	 *     graphLineThickness: (number|undefined),
	 *     ticksCount: (number|undefined),
	 *     tickLineColor: (string|undefined),
	 *     tickTextColor: (string|undefined),
	 *     tickBackgroundColor: (string|undefined),
	 *     emptyText: (string|undefined)
	 * }=} opt
	 */
	constructor(canvas, {
		xTicksType = TicksType.DECIMAL,
		xTicksBackground = false,
		yTicksType = TicksType.DECIMAL,
		yTicksScale = TicksScale.EXTREMUM,
		yTicksBackground = false,
		topPadding = 0,
		bottomPadding = 0,
		leftPadding = 0,
		rightPadding = 0,
		graphLineThickness = 1,
		ticksCount = 10,
		tickLineColor = '#000',
		tickTextColor = '#000',
		tickBackgroundColor = '#000',
		emptyText = ''
	} = {}) {
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
		this._topPadding = topPadding;

		/**
		 * @type {number}
		 * @private
		 */
		this._bottomPadding = bottomPadding;

		/**
		 * @type {number}
		 * @private
		 */
		this._leftPadding = leftPadding;

		/**
		 * @type {number}
		 * @private
		 */
		this._rightPadding = rightPadding;

		/**
		 * @type {number}
		 * @private
		 */
		this._graphLineThickness = graphLineThickness;

		/**
		 * @type {number}
		 * @private
		 */
		this._ticksCount = ticksCount;

		/**
		 * @type {string}
		 * @private
		 */
		this._tickLineColor = tickLineColor;

		/**
		 * @type {string}
		 * @private
		 */
		this._tickTextColor = tickTextColor;

		/**
		 * @type {string}
		 * @private
		 */
		this._tickBackgroundColor = tickBackgroundColor;

		/**
		 * @type {string}
		 * @private
		 */
		this._emptyText = emptyText;

		/**
		 * @type {Array<Graph>}
		 * @private
		 */
		this._graphs = [];

		/**
		 * @type {Array<Graph>}
		 * @private
		 */
		this._removingGraphs = [];

		/**
		 * @type {Map<Graph, Array<Point>>}
		 * @private
		 */
		this._graphsRanges = new Map();

		/**
		 * @type {Map<Graph, number>}
		 * @private
		 */
		this._graphsAlphas = new Map();

		/**
		 * @type {Map<Graph, Transition>}
		 * @private
		 */
		this._graphsTransitions = new Map();

		/**
		 * @type {Array<number>}
		 * @private
		 */
		this._xTicks = [];

		/**
		 * @type {TicksType}
		 * @private
		 */
		this._xTicksType = xTicksType;

		/**
		 * @type {boolean}
		 * @private
		 */
		this._xTicksBackround = xTicksBackground;

		/**
		 * @type {Array<number>}
		 * @private
		 */
		this._yTicks = [];

		/**
		 * @type {TicksType}
		 * @private
		 */
		this._yTicksType = yTicksType;

		/**
		 * @type {TicksScale}
		 * @private
		 */
		this._yTicksScale = yTicksScale;

		/**
		 * @type {boolean}
		 * @private
		 */
		this._yTicksBackround = yTicksBackground;

		/**
		 * @type {Map<number, number>}
		 * @private
		 */
		this._yTicksAlphas = new Map();

		/**
		 * @type {?Transition}
		 * @private
		 */
		this._yScaleTransition = null;

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
		 * @type {number}
		 * @private
		 */
		this._pixelsPerX = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._pixelsPerY = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._maxX = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._maxXTick = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._minX = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._minXTick = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._maxY = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._maxYTick = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._minY = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._minYTick = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._minRangeX = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._minRangeY = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._maxRangeX = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._maxRangeY = NaN;
	}

	/**
	 * @param {Graph} graph
	 */
	addGraph(graph) {
		if (!this._graphs.includes(graph)) {
			this._graphs.push(graph);
		}

		if (!this._graphsAlphas.has(graph)) {
			this._graphsAlphas.set(graph, 0);
		}

		const range = isNaN(this._minRangeX) || isNaN(this._maxRangeX) ?
			graph.points :
			graph.getRange(this._minRangeX, this._maxRangeX);

		this._graphsRanges.set(graph, range);

		const {x: minX, y: minY} = graph.getMin();
		if (isNaN(this._minX) || minX < this._minX) {
			this._minX = minX;
		}
		if (isNaN(this._minY) || minY < this._minY) {
			this._minY = minY;
		}

		const {x: maxX, y: maxY} = graph.getMax();
		if (isNaN(this._maxX) || maxX > this._maxX) {
			this._maxX = maxX;
		}
		if (isNaN(this._maxY) || maxY > this._maxY) {
			this._maxY = maxY;
		}

		const minRangeY = findMin(this._graphsRanges.get(graph), (point) => point.y);
		if (isNaN(this._minRangeY) || minRangeY < this._minRangeY) {
			this._minRangeY = minRangeY;
		}

		const maxRangeY = findMax(this._graphsRanges.get(graph), (point) => point.y);
		if (isNaN(this._maxRangeY) || maxRangeY > this._maxRangeY) {
			this._maxRangeY = maxRangeY;
		}

		const transitionIntervals = [{
			from: this._graphsAlphas.get(graph), to: 1
		}];

		const onTransitionProgress = ([alpha]) => {
			this._graphsAlphas.set(graph, alpha);
		};

		const onTransitionComplete = () => {
			this._graphsTransitions.delete(graph);
		};

		const onTransitionUpdate = () => {
			this._draw();
		};

		const transition = new Transition(
			transitionIntervals,
			TRANSITION_DURATION,
			Timing.EASE_OUT,
			onTransitionProgress,
			onTransitionComplete,
			onTransitionUpdate
		);

		const currentTransition = this._graphsTransitions.get(graph);
		if (currentTransition && currentTransition.isActive()) {
			currentTransition.stop();
		}

		this._graphsTransitions.set(graph, transition);
	}

	/**
	 * @param {Graph} graph
	 */
	removeGraph(graph) {
		const otherGraphs = this._graphs.filter((someGraph) =>
			someGraph !== graph && !this._removingGraphs.includes(someGraph)
		);
		const otherRanges = otherGraphs.map((graph) => this._graphsRanges.get(graph));

		const {x: minX, y: minY} = graph.getMin();
		if (minX === this._minX || minY === this._minY) {
			const otherMins = otherGraphs.map((graph) => graph.getMin());

			const newMinX = findMin(otherMins, (({x}) => x));
			if (newMinX !== this._minX) {
				this._minX = newMinX;
			}

			const newMinY = findMin(otherMins, (({y}) => y));
			if (newMinY !== this._minY) {
				this._minY = newMinY;
			}
		}

		const {x: maxX, y: maxY} = graph.getMax();
		if (maxX === this._maxX || maxY === this._maxY) {
			const otherMaxes = otherGraphs.map((graph) => graph.getMax());

			const newMaxX = findMax(otherMaxes, (({x}) => x));
			if (newMaxX !== this._maxX) {
				this._maxX = newMaxX;
			}

			const newMaxY = findMax(otherMaxes, (({y}) => y));
			if (newMaxY !== this._maxY) {
				this._maxY = newMaxY;
			}
		}

		const minRangeY = findMin(this._graphsRanges.get(graph), (point) => point.y);
		if (minRangeY === this._minRangeY) {
			const otherMins = otherRanges.map((range) => findMin(range, (point) => point.y));

			const newMinY = findMin(otherMins, identity);
			if (newMinY !== this._minRangeY) {
				this._minRangeY = newMinY;
			}
		}

		const maxRangeY = findMax(this._graphsRanges.get(graph), (point) => point.y);
		if (maxRangeY === this._maxRangeY) {
			const otherMaxes = otherRanges.map((range) => findMax(range, (point) => point.y));

			const newMaxY = findMax(otherMaxes, identity);
			if (newMaxY !== this._maxRangeY) {
				this._maxRangeY = newMaxY;
			}
		}

		const transitionIntervals = [{
			from: this._graphsAlphas.get(graph), to: 0
		}];

		const onTransitionProgress = ([alpha]) => {
			this._graphsAlphas.set(graph, alpha);
		};

		const onTransitionComplete = () => {
			this._graphs.splice(this._graphs.indexOf(graph), 1);
			this._removingGraphs.splice(this._removingGraphs.indexOf(graph), 1);

			this._graphsAlphas.delete(graph);
			this._graphsRanges.delete(graph);
			this._graphsTransitions.delete(graph);
		};

		const onTransitionUpdate = () => {
			this._draw();
		};

		const onTransitionCancel = () => {
			this._removingGraphs.splice(this._removingGraphs.indexOf(graph), 1);
		};

		const transition = new Transition(
			transitionIntervals,
			TRANSITION_DURATION,
			Timing.EASE_IN,
			onTransitionProgress,
			onTransitionComplete,
			onTransitionUpdate,
			onTransitionCancel
		);

		const currentTransition = this._graphsTransitions.get(graph);
		if (currentTransition && currentTransition.isActive()) {
			currentTransition.stop();
		}

		if (isNaN(this._minX) && isNaN(this._maxX)) {
			this._stopAllTransitions();
			this._clearGraphs();
		} else {
			this._graphsTransitions.set(graph, transition);
			this._removingGraphs.push(graph);
		}
	}

	clear() {
		this._stopAllTransitions();
		this._clearGraphs();

		this._xTicks.length = 0;
		this._yTicks.length = 0;
		this._yTicksAlphas.clear();

		this._width = NaN;
		this._height = NaN;

		this._pixelsPerX = NaN;
		this._pixelsPerY = NaN;

		this._maxX = NaN;
		this._maxXTick = NaN;

		this._minX = NaN;
		this._minXTick = NaN;

		this._maxY = NaN;
		this._maxYTick = NaN;

		this._minY = NaN;
		this._minYTick = NaN;

		this._minRangeX = NaN;
		this._minRangeY = NaN;

		this._maxRangeX = NaN;
		this._maxRangeY = NaN;
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
	 * @return {number}
	 */
	getGraphLineThickness() {
		return this._graphLineThickness;
	}

	/**
	 * @return {number}
	 */
	getTopPadding() {
		return this._topPadding;
	}

	/**
	 * @return {number}
	 */
	getBottomPadding() {
		return this._bottomPadding;
	}

	/**
	 * @param {Axis} axis
	 * @return {TicksType}
	 */
	getAxisTicksType(axis) {
		return axis === Axis.X ? this._xTicksType : this._yTicksType;
	}

	/**
	 * @param {number} pixels
	 * @return {number}
	 */
	getXByPixels(pixels) {
		let x = this._minXTick + ((pixels - this._leftPadding) / this._pixelsPerX);

		return clamp(x, this._minXTick, this._maxXTick);
	}

	/**
	 * @param {number} pixels
	 * @return {number}
	 */
	getYByPixels(pixels) {
		let y = this._minYTick + ((this._height - this._bottomPadding - pixels) / this._pixelsPerY);

		return clamp(y, this._minYTick, this._maxYTick);
	}

	/**
	 * @param {number} x
	 * @return {number}
	 */
	getPixelsByX(x) {
		return this._leftPadding + this._pixelsPerX * (x - this._minXTick);
	}

	/**
	 * @param {number} y
	 * @return {number}
	 */
	getPixelsByY(y) {
		return this._height - this._bottomPadding - this._pixelsPerY * (y - this._minYTick);
	}

	/**
	 * @param {number} thickness
	 */
	setGraphLineThickness(thickness) {
		this._graphLineThickness = thickness;
	}

	/**
	 * @param {string} color
	 */
	setTickLineColor(color) {
		this._tickLineColor = color;
	}

	/**
	 * @param {string} color
	 */
	setTickTextColor(color) {
		this._tickTextColor = color;
	}

	/**
	 * @param {string} color
	 */
	setTickBackgroundColor(color) {
		this._tickBackgroundColor = color;
	}

	/**
	 * @return {{start: number, end: number}}
	 */
	getRange() {
		return {
			start: isNaN(this._minRangeX) ?
				this._minX :
				this._minRangeX,

			end: isNaN(this._maxRangeX) ?
				this._maxX :
				this._maxRangeX
		};
	}

	/**
	 * @param {number} startX
	 * @param {number} endX
	 */
	setRange(startX, endX) {
		this._minRangeX = startX;
		this._maxRangeX = endX;

		this._minRangeY = NaN;
		this._maxRangeY = NaN;

		this._graphs.forEach((graph) => {
			const range = graph.getRange(startX, endX);

			this._graphsRanges.set(graph, range);

			if (this._removingGraphs.includes(graph)) {
				return;
			}

			const minY = findMin(range, (point) => point.y);
			const maxY = findMax(range, (point) => point.y);

			if (isNaN(this._minRangeY) || minY < this._minRangeY) {
				this._minRangeY = minY;
			}

			if (isNaN(this._maxRangeY) || maxY > this._maxRangeY) {
				this._maxRangeY = maxY;
			}
		});
	}

	/**
	 * @param {number} value
	 * @param {Axis} axis
	 * @return {string}
	 */
	formatValue(value, axis) {
		const type = axis === Axis.X ? this._xTicksType : this._yTicksType;

		if (type === TicksType.DATE) {
			const spacing = axis === Axis.X ?
				(this._maxXTick - this._minXTick) / this._xTicks.length :
				(this._maxYTick - this._minYTick) / this._yTicks.length;

			return formatDate(new Date(value), spacing);
		}

		if (type === TicksType.COMPACT) {
			return compactNumber(value);
		}

		return String(value);
	}

	resize() {
		this._width = this._canvas.parentNode.offsetWidth;
		this._height = this._canvas.parentNode.offsetHeight;

		this._canvas.width = this._width;
		this._canvas.height = this._height;

		this._pixelsPerX = (this._width - this._leftPadding - this._rightPadding) / (this._maxXTick - this._minXTick);
		this._pixelsPerY = (this._height - this._topPadding - this._bottomPadding) / (this._maxYTick - this._minYTick);
	}

	draw() {
		this._scaleXAxis();
		this._scaleYAxis();

		if (this._yScaleTransition && this._yScaleTransition.isPending()) {
			this._yScaleTransition.start();
		}

		Array.from(this._graphsTransitions.values())
			.forEach((transition) => {
				if (transition.isPending()) {
					transition.start();
				}
			});

		this._draw();
	}

	/**
	 * @private
	 */
	_prepareCanvas() {
		this._context.setTransform(1, 0, 0, 1, 0, 0);
		this._context.clearRect(0, 0, this._width, this._height);

		const translateX = this._pixelsPerX * this._minXTick;
		const translateY = this._pixelsPerY * this._minYTick;

		this._context.translate(translateX * -1, translateY);
	}

	/**
	 * @private
	 */
	_draw() {
		this._prepareCanvas();

		this._drawGrid();
		this._drawGraphs();
		this._drawTicks();

		if (this._minRangeX === this._maxRangeX || isNaN(this._minX) && isNaN(this._maxX)) {
			this._drawEmptyText();
		}
	}

	/**
	 * @private
	 */
	_drawGrid() {
		this._context.lineWidth = TICK_LINE_THICKNESS;

		if (this._yTicksType !== TicksType.NONE) {
			const xPixels = this._pixelsPerX * this._minXTick;

			this._yTicks.forEach((tick) => {
				const yPixels = this._height - this._bottomPadding - this._pixelsPerY * tick;
				const alpha = this._yTicksAlphas.has(tick) ? this._yTicksAlphas.get(tick) : 1;

				this._context.strokeStyle = hexToRGB(this._tickLineColor, alpha);

				this._context.beginPath();
				this._context.moveTo(xPixels, yPixels);
				this._context.lineTo(xPixels + this._width, yPixels);
				this._context.stroke();
			});
		}
	}

	/**
	 * @private
	 */
	_drawGraphs() {
		this._context.lineCap = 'round';
		this._context.lineJoin = 'round';
		this._context.lineWidth = this._graphLineThickness;

		this._graphs.forEach((graph) => {
			const alpha = this._graphsAlphas.get(graph);
			const range = this._graphsRanges.get(graph);

			let lastDrawnXPixels;

			this._context.beginPath();

			range.forEach((point, index) => {
				const xPixels = this._leftPadding + this._pixelsPerX * point.x;
				const yPixels = this._height - this._bottomPadding - this._pixelsPerY * point.y;

				// Decimate redundant points
				if (!lastDrawnXPixels || floor(lastDrawnXPixels) !== floor(xPixels)) {
					if (index === 0) {
						this._context.moveTo(xPixels, yPixels);
					} else {
						this._context.lineTo(xPixels, yPixels);
					}

					lastDrawnXPixels = xPixels;
				}
			});

			this._context.strokeStyle = hexToRGB(graph.color, alpha);
			this._context.stroke();
		});
	}

	/**
	 * @private
	 */
	_drawTicks() {
		this._context.font = TICK_FONT;

		if (this._xTicksType !== TicksType.NONE) {
			const yPixels = this._height - this._pixelsPerY * this._minYTick - TICK_TEXT_BOTTOM_MARGIN;
			const maxTextWidth = this._width / this._xTicks.length;

			const isStartReached = this._xTicks[0] === this._minX;
			const isEndReached = this._xTicks[this._xTicks.length - 1] === this._maxX;

			this._xTicks.forEach((tick) => {
				const xPixels = this._pixelsPerX * tick;
				const text = this.formatValue(tick, Axis.X);

				if (isStartReached) {
					this._context.textAlign = 'start';
				} else if (isEndReached) {
					this._context.textAlign = 'end';
				} else {
					this._context.textAlign = 'center';
				}

				if (this._xTicksBackround) {
					const textBackground = createTextBackgroundStub(text);
					const measuredTextWith = this._context.measureText(text).width;

					this._context.fillStyle = this._tickBackgroundColor;
					this._context.fillText(textBackground, xPixels, yPixels, min(measuredTextWith, maxTextWidth));
				}

				this._context.fillStyle = this._tickTextColor;
				this._context.fillText(text, xPixels, yPixels, maxTextWidth);
			});
		}

		if (this._yTicksType !== TicksType.NONE) {
			const xPixels = this._pixelsPerX * this._minXTick;

			this._yTicks.forEach((tick) => {
				const yPixels = this._height - this._bottomPadding - this._pixelsPerY * tick - TICK_TEXT_BOTTOM_MARGIN;

				const text = this.formatValue(tick, Axis.Y);
				const alpha = this._yTicksAlphas.has(tick) ? this._yTicksAlphas.get(tick) : 1;

				this._context.textAlign = 'start';

				if (this._yTicksBackround) {
					const textBackground = createTextBackgroundStub(text);
					const measuredTextWith = this._context.measureText(text).width;

					this._context.fillStyle = hexToRGB(this._tickBackgroundColor, alpha);
					this._context.fillText(textBackground, xPixels, yPixels, measuredTextWith);
				}

				this._context.fillStyle = hexToRGB(this._tickTextColor, alpha);
				this._context.fillText(text, xPixels, yPixels);
			});
		}
	}

	/**
	 * @private
	 */
	_drawEmptyText() {
		this._context.font = NO_DATA_TEXT_FONT;
		this._context.textBaseline = 'middle';
		this._context.textAlign = 'center';

		this._context.fillStyle = this._tickTextColor;
		this._context.fillText(this._emptyText, this._width / 2, this._height / 2);
	}

	/**
	 * @private
	 */
	_scaleXAxis() {
		const minX = isNaN(this._minRangeX) ? this._minX : this._minRangeX;
		const maxX = isNaN(this._maxRangeX) ? this._maxX : this._maxRangeX;

		const spacing = (maxX - minX) / this._ticksCount;
		if (!spacing) {
			this._minXTick = NaN;
			this._maxXTick = NaN;
			this._pixelsPerX = NaN;
			this._xTicks = [];

			return;
		}

		this._minXTick = minX;
		this._maxXTick = maxX;

		this._pixelsPerX = (this._width - this._leftPadding - this._rightPadding) / (this._maxXTick - this._minXTick);

		const offsetX = this._maxXTick === this._maxX ? 0 : (this._minX - this._minXTick) % spacing;

		this._xTicks = [this._minXTick + offsetX];
		while (this._xTicks[this._xTicks.length - 1] < (this._maxXTick + offsetX)) {
			this._xTicks.push(this._minXTick + offsetX + (this._xTicks.length * spacing));
		}
	}

	/**
	 * @private
	 */
	_scaleYAxis() {
		const minY = isNaN(this._minRangeY) ? this._minY : this._minRangeY;
		const maxY = isNaN(this._maxRangeY) ? this._maxY : this._maxRangeY;

		let spacing = (maxY - minY) / this._ticksCount;
		if (!spacing) {
			this._minYTick = NaN;
			this._maxYTick = NaN;
			this._pixelsPerY = NaN;
			this._yTicks = [];
			this._yTicksAlphas.clear();

			return;
		}

		const isNice = this._yTicksScale === TicksScale.NICE;
		if (isNice) {
			spacing = niceNumber(spacing);

			const ticksNumber = ceil(maxY / spacing) - floor(minY / spacing);
			if (ticksNumber > this._ticksCount) {
				spacing = niceNumber(ticksNumber * spacing / this._ticksCount);
			}
		}

		const newMinYTick = isNice ? (floor(minY / spacing) * spacing) : minY;
		const newMaxYTick = isNice ? (ceil(maxY / spacing) * spacing) : maxY;

		if (isNaN(this._minYTick) || isNaN(this._maxYTick)) {
			this._minYTick = newMinYTick;
			this._maxYTick = newMaxYTick;

			this._pixelsPerY = (this._height - this._topPadding - this._bottomPadding) / (this._maxYTick - this._minYTick);

			this._yTicks = [this._minYTick];
			while (this._yTicks[this._yTicks.length - 1] < this._maxYTick) {
				this._yTicks.push(this._minYTick + (this._yTicks.length * spacing));
			}

			return;
		}

		const currentTransitionIntervals = this._yScaleTransition && this._yScaleTransition.getIntervals();
		const currentTransitionValues = this._yScaleTransition && this._yScaleTransition.getValues();

		const oldMinYTick = currentTransitionIntervals ? currentTransitionIntervals[0].to : this._minYTick;
		const oldMaxYTick = currentTransitionIntervals ? currentTransitionIntervals[1].to : this._maxYTick;

		if (newMinYTick === oldMinYTick && newMaxYTick === oldMaxYTick) {
			return;
		}

		const oldYTicks = this._yTicks.slice();

		const newYTicks = [newMinYTick];
		while (newYTicks[newYTicks.length - 1] < newMaxYTick) {
			newYTicks.push(newMinYTick + (newYTicks.length * spacing));
		}

		this._yTicks = Array.from(new Set([...oldYTicks, ...newYTicks].sort((a, b) => a - b)));
		this._yTicks.forEach((tick) => {
			if (this._yTicksAlphas.has(tick)) {
				return;
			}

			if (newYTicks.includes(tick)) {
				this._yTicksAlphas.set(tick, 0);
			}

			if (oldYTicks.includes(tick)) {
				this._yTicksAlphas.set(tick, 1);
			}
		});

		const initialYTicksAlphas = new Map(this._yTicksAlphas);

		const transitionIntervals = [
			{from: currentTransitionValues ? currentTransitionValues[0] : oldMinYTick, to: newMinYTick},
			{from: currentTransitionValues ? currentTransitionValues[1] : oldMaxYTick, to: newMaxYTick},
			{from: 0, to: 1}
		];

		const onTransitionProgress = ([minYTick, maxYTick, alphaDiff]) => {
			this._minYTick = minYTick;
			this._maxYTick = maxYTick;

			this._pixelsPerY = (this._height - this._topPadding - this._bottomPadding) / (maxYTick - minYTick);

			this._yTicks.forEach((tick) => {
				const initialAlpha = initialYTicksAlphas.get(tick);

				if (newYTicks.includes(tick)) {
					this._yTicksAlphas.set(tick, initialAlpha + alphaDiff);
				} else if (oldYTicks.includes(tick)) {
					this._yTicksAlphas.set(tick, initialAlpha - alphaDiff);
				}
			});
		};

		const onTransitionComplete = () => {
			this._yScaleTransition = null;
			this._yTicksAlphas.clear();

			this._yTicks = [newMinYTick];
			while (this._yTicks[this._yTicks.length - 1] < newMaxYTick) {
				this._yTicks.push(newMinYTick + (this._yTicks.length * spacing));
			}
		};

		const onTransitionUpdate = () => {
			this._draw();
		};

		if (this._yScaleTransition) {
			this._yScaleTransition.stop();
		}

		this._yScaleTransition = new Transition(
			transitionIntervals,
			TRANSITION_DURATION,
			Timing.LINEAR,
			onTransitionProgress,
			onTransitionComplete,
			onTransitionUpdate
		);
	}

	/**
	 * @private
	 */
	_stopAllTransitions() {
		if (this._yScaleTransition) {
			this._yScaleTransition.stop();
			this._yScaleTransition = null;
		}

		Array.from(this._graphsTransitions.values())
			.forEach((transition) => {
				if (transition.isActive()) {
					transition.stop();
				}
			});
	}

	/**
	 * @private
	 */
	_clearGraphs() {
		this._graphs.length = 0;
		this._removingGraphs.length = 0;

		this._graphsRanges.clear();
		this._graphsAlphas.clear();
		this._graphsTransitions.clear();
	}
}

/**
 * @param {string} text
 * @return {string}
 */
function createTextBackgroundStub(text) {
	return Array(text.length).fill('█').join('')
}
