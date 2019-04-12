import IView from '../interfaces/i-view.js';
import IScale from '../interfaces/i-scale.js';
import {InterpolationType} from '../graph.js';
import {Timing} from '../transition.js';
import {findMax, findMin, hexToRGB, identity} from '../utils.js';

/**
 * @const {number}
 */
const DEFAULT_THICKNESS = 1;

/**
 * @const {number}
 */
const DEFAULT_HIGHLIGHT_RADIUS = 10;

/**
 * @const {string}
 */
const DEFAULT_HIGHLIGHT_COLOR = '#000000';

/**
 * @typedef {{
 *     thickness: (number|undefined),
 *     highlightRadius: (number|undefined),
 *     highlightColor: (string|undefined)
 * }}
 */
export let Options;

/**
 * @implements {IView<Options>}
 */
export default class Line {
	/**
	 * @param {CanvasRenderingContext2D} context
	 * @param {IScale} xScale
	 * @param {IScale} yScale
	 * @param {Options=} options
	 */
	constructor(context, xScale, yScale, options) {
		/**
		 * @type {CanvasRenderingContext2D}
		 * @private
		 */
		this._context = context;

		/**
		 * @type {IScale}
		 * @private
		 */
		this._xScale = xScale;

		/**
		 * @type {IScale}
		 * @private
		 */
		this._yScale = yScale;

		/**
		 * @type {number}
		 * @private
		 */
		this._thickness = DEFAULT_THICKNESS;

		/**
		 * @type {number}
		 * @private
		 */
		this._highlightRadius = DEFAULT_HIGHLIGHT_RADIUS;

		/**
		 * @type {string}
		 * @private
		 */
		this._highlightColor = DEFAULT_HIGHLIGHT_COLOR;

		this.setOptions(options);
	}

	/**
	 * @override
	 */
	setOptions({thickness = NaN, highlightRadius = NaN, highlightColor} = {}) {
		if (!isNaN(thickness)) {
			this._thickness = thickness;
		}

		if (!isNaN(highlightRadius)) {
			this._highlightRadius = highlightRadius;
		}

		if (highlightColor) {
			this._highlightColor = highlightColor;
		}
	}

	/**
	 * @override
	 */
	getInterpolationType() {
		return InterpolationType.LINEAR;
	}

	/**
	 * @return {Timing}
	 */
	getFadeInTransitionTiming() {
		return Timing.EASE_OUT;
	}

	/**
	 * @return {Timing}
	 */
	getFadeOutTransitionTiming() {
		return Timing.EASE_IN;
	}

	/**
	 * @override
	 */
	selectHighlightedPoint(start, middle, end) {
		const distanceToStart = middle.x - start.x;
		const distanceToEnd = end.x - middle.x;

		let highlightedPoint = distanceToStart < distanceToEnd ? start : end;
		if (highlightedPoint.isInterpolated) {
			highlightedPoint = highlightedPoint === start ? end : start;
		}

		return highlightedPoint;
	}

	/**
	 * @override
	 */
	addGraphToXScale(graph) {
		const minX = graph.getMinX();
		const maxX = graph.getMaxX();

		const xScaleStart = this._xScale.getStart();
		const xScaleEnd = this._xScale.getEnd();

		if (isNaN(xScaleStart) || minX < xScaleStart) {
			this._xScale.setStart(minX);
		}

		if (isNaN(xScaleEnd) || maxX > xScaleEnd) {
			this._xScale.setEnd(maxX);
		}
	}

	/**
	 * @override
	 */
	addGraphToYScale(graph, otherGraphs, {getGraphRange}) {
		const minY = graph.getMinY();
		const maxY = graph.getMaxY();

		const yScaleStart = this._yScale.getStart();
		const yScaleEnd = this._yScale.getEnd();

		if ((isNaN(yScaleStart) || minY < yScaleStart)) {
			this._yScale.setStart(minY);
		}

		if ((isNaN(yScaleEnd) || maxY > yScaleEnd)) {
			this._yScale.setEnd(maxY);
		}

		if (this._xScale.isRangeGiven()) {
			const range = getGraphRange(graph);

			const minRangeY = findMin(range, (point) => point.y);
			const maxRangeY = findMax(range, (point) => point.y);

			const yScaleRangeStart = this._yScale.getRangeStart();
			const yScaleRangeEnd = this._yScale.getRangeEnd();

			if (isNaN(yScaleRangeStart) || minRangeY < yScaleRangeStart) {
				this._yScale.setRangeStart(minRangeY);
			}

			if (isNaN(yScaleRangeEnd) || maxRangeY > yScaleRangeEnd) {
				this._yScale.setRangeEnd(maxRangeY);
			}
		}
	}

	/**
	 * @override
	 */
	removeGraphFromXScale(graph, otherGraphs) {
		const minX = graph.getMinX();
		const maxX = graph.getMaxX();

		const xScaleStart = this._xScale.getStart();
		const xScaleEnd = this._xScale.getEnd();

		if (minX === xScaleStart) {
			const otherMinXs = otherGraphs.map((graph) => graph.getMinX());

			this._xScale.setStart(findMin(otherMinXs, identity));
		}

		if (maxX === xScaleEnd) {
			const otherMaxXs = otherGraphs.map((graph) => graph.getMaxX());

			this._xScale.setEnd(findMax(otherMaxXs, identity));
		}
	}

	/**
	 * @override
	 */
	removeGraphFromYScale(graph, otherGraphs, {getGraphRange}) {
		const minY = graph.getMinY();
		const maxY = graph.getMaxY();

		const yScaleEnd = this._yScale.getEnd();
		const yScaleStart = this._yScale.getStart();

		if (minY === yScaleStart) {
			const otherMinYs = otherGraphs.map((graph) => graph.getMinY());

			this._yScale.setStart(findMin(otherMinYs, identity));
		}

		if (maxY === yScaleEnd) {
			const otherMaxYs = otherGraphs.map((graph) => graph.getMaxY());

			this._yScale.setEnd(findMax(otherMaxYs, identity));
		}

		if (this._xScale.isRangeGiven()) {
			const range = getGraphRange(graph);
			const otherRanges = otherGraphs.map((otherGraph) => getGraphRange(otherGraph));

			const minRangeY = findMin(range, (point) => point.y);
			const maxRangeY = findMax(range, (point) => point.y);

			const yScaleRangeStart = this._yScale.getRangeStart();
			const yScaleRangeEnd = this._yScale.getRangeEnd();

			if (minRangeY === yScaleRangeStart) {
				const otherRangeMinYs = otherRanges.map((range) => findMin(range, (point) => point.y));

				this._yScale.setRangeStart(findMin(otherRangeMinYs, identity));
			}

			if (maxRangeY === yScaleRangeEnd) {
				const otherRangeMaxYs = otherRanges.map((range) => findMax(range, (point) => point.y));

				this._yScale.setRangeEnd(findMax(otherRangeMaxYs, identity));
			}
		}
	}

	/**
	 * @override
	 */
	updateYScaleRange(graphs, {getGraphRange}) {
		graphs.forEach((graph) => {
			const range = getGraphRange(graph);

			const minRangeY = findMin(range, (point) => point.y);
			const maxRangeY = findMax(range, (point) => point.y);

			const yScaleRangeStart = this._yScale.getRangeStart();
			const yScaleRangeEnd = this._yScale.getRangeEnd();

			if (isNaN(yScaleRangeStart) || minRangeY < yScaleRangeStart) {
				this._yScale.setRangeStart(minRangeY);
			}

			if (isNaN(yScaleRangeEnd) || maxRangeY > yScaleRangeEnd) {
				this._yScale.setRangeEnd(maxRangeY);
			}
		});
	}

	/**
	 * @override
	 */
	draw(graphs, {getGraphRange, getGraphVisibility, getGraphHighlightedPoint}) {
		this._context.save();

		this._context.translate(
			this._xScale.getPixelsPerValue() * this._xScale.getFitStart() * -1,
			this._yScale.getPixelsPerValue() * this._yScale.getFitStart()
		);

		this._context.lineCap = 'round';
		this._context.lineJoin = 'round';
		this._context.lineWidth = this._thickness;

		graphs.forEach((graph) => {
			const range = getGraphRange(graph);
			const visibility = getGraphVisibility(graph);

			this._context.beginPath();

			this._context.strokeStyle = hexToRGB(graph.color, visibility);
			this._context.strokeStyle = hexToRGB(graph.color, visibility);

			range.forEach((point, index) => {
				const xPixels = this._xScale.getPixelsByValue(point.x);
				const yPixels = this._yScale.getPixelsByValue(point.y);

				if (index === 0) {
					this._context.moveTo(xPixels, yPixels);
				} else {
					this._context.lineTo(xPixels, yPixels);
				}
			});

			this._context.stroke();

			const highlightedPoint = getGraphHighlightedPoint(graph);

			if (highlightedPoint) {
				const xPixels = this._xScale.getPixelsByValue(highlightedPoint.x);
				const yPixels = this._yScale.getPixelsByValue(highlightedPoint.y);

				this._context.fillStyle = hexToRGB(this._highlightColor, visibility);

				this._context.beginPath();
				this._context.arc(xPixels, yPixels, this._highlightRadius, 0, 2 * Math.PI);
				this._context.fill();
				this._context.stroke();
			}
		});

		this._context.restore();
	}
}
