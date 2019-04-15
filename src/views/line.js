import IView from '../interfaces/i-view.js';
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
	 * @param {Options=} options
	 */
	constructor(options) {
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
	findYScaleStart(graphs) {
		const yMins = graphs.map((graph) => graph.getMinY());

		return findMin(yMins, identity);
	}

	/**
	 * @override
	 */
	findYScaleEnd(graphs) {
		const yMaxes = graphs.map((graph) => graph.getMaxY());

		return findMax(yMaxes, identity);
	}

	/**
	 * @override
	 */
	findYScaleRangeStart(ranges) {
		const yMins = ranges.map((range) => findMin(range, (point) => point.y));

		return findMin(yMins, identity);
	}

	/**
	 * @override
	 */
	findYScaleRangeEnd(ranges) {
		const yMaxes = ranges.map((range) => findMax(range, (point) => point.y));

		return findMax(yMaxes, identity);
	}

	/**
	 * @override
	 */
	draw(context, xScale, yScale, graphs, {getGraphRange, getGraphVisibility}) {
		context.lineCap = 'round';
		context.lineJoin = 'round';
		context.lineWidth = this._thickness;

		graphs.forEach((graph) => {
			const range = getGraphRange(graph);
			const visibility = getGraphVisibility(graph);

			context.beginPath();
			context.strokeStyle = hexToRGB(graph.color, visibility);

			range.forEach((point, index) => {
				const xPixels = xScale.getPixelsByValue(point.x);
				const yPixels = yScale.getPixelsByValue(point.y);

				if (index === 0) {
					context.moveTo(xPixels, yPixels);
				} else {
					context.lineTo(xPixels, yPixels);
				}
			});

			context.stroke();
		});
	}

	/**
	 * @override
	 */
	drawOverlays(context, xScale, yScale, graphs, {getGraphVisibility, getGraphHighlightedPoint}) {
		context.lineWidth = this._thickness;

		graphs.forEach((graph) => {
			const visibility = getGraphVisibility(graph);
			const highlightedPoint = getGraphHighlightedPoint(graph);

			if (highlightedPoint) {
				const xPixels = xScale.getPixelsByValue(highlightedPoint.x);
				const yPixels = yScale.getPixelsByValue(highlightedPoint.y);

				context.fillStyle = hexToRGB(this._highlightColor, visibility);
				context.strokeStyle = hexToRGB(graph.color, visibility);

				context.beginPath();
				context.arc(xPixels, yPixels, this._highlightRadius, 0, 2 * Math.PI);
				context.fill();
				context.stroke();
			}
		});
	}
}
