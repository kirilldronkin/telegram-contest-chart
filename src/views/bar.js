import IView from '../interfaces/i-view.js';
import {InterpolationType} from '../graph.js';
import {Timing} from '../transition.js';
import {findMax, identity, hexToRGB} from '../utils.js';

const {round} = Math;

/**
 * @const {number}
 */
const DEFAULT_HIGHLIGHT_DIMMING_ALPHA = 0.5;

/**
 * @typedef {{
 *     highlightDimmingAlpha: (number|undefined)
 * }}
 */
export let Options;

/**
 * @implements {IView<Options>}
 */
export default class Bar {
	/**
	 * @param {Options=} options
	 */
	constructor(options) {
		/**
		 * @type {number}
		 * @private
		 */
		this._highlightDimmingAlpha = DEFAULT_HIGHLIGHT_DIMMING_ALPHA;

		this.setOptions(options);
	}

	/**
	 * @override
	 */
	setOptions({highlightDimmingAlpha = NaN} = {}) {
		if (!isNaN(highlightDimmingAlpha)) {
			this._highlightDimmingAlpha = highlightDimmingAlpha;
		}
	}

	/**
	 * @override
	 */
	getInterpolationType() {
		return InterpolationType.NEIGHBOR;
	}

	/**
	 * @return {Timing}
	 */
	getFadeInTransitionTiming() {
		return Timing.LINEAR;
	}

	/**
	 * @return {Timing}
	 */
	getFadeOutTransitionTiming() {
		return Timing.LINEAR;
	}

	/**
	 * @override
	 */
	selectHighlightedPoint(start) {
		return start;
	}

	/**
	 * @override
	 */
	findYScaleStart() {
		return 0;
	}

	/**
	 * @override
	 */
	findYScaleEnd(graphs) {
		const maxPointsCount = findMax(graphs.map((graph) => graph.points.length), identity);

		const ySums = [];
		for (let i = 0; i < maxPointsCount; i++) {
			ySums.push(graphs.reduce((acc, graph) => acc + (graph.points[i] ? graph.points[i].y : 0), 0));
		}

		return findMax(ySums, identity);
	}

	/**
	 * @override
	 */
	findYScaleRangeStart() {
		return 0;
	}

	/**
	 * @override
	 */
	findYScaleRangeEnd(ranges) {
		const maxPointsCount = findMax(ranges.map((range) => range.length), identity);

		const ySums = [];
		for (let i = 0; i < maxPointsCount; i++) {
			ySums.push(ranges.reduce((acc, range) => acc + (range[i] ? range[i].y : 0), 0));
		}

		return findMax(ySums, identity);
	}

	/**
	 * @override
	 */
	draw(context, xScale, yScale, graphs, {getGraphRange, getGraphVisibility, getGraphHighlightedPoint}) {
		const yPixelsStack = [];

		graphs.forEach((graph) => {
			const range = getGraphRange(graph);
			const visibility = getGraphVisibility(graph);
			const highlightedPoint = getGraphHighlightedPoint(graph);

			let prevXPixels;

			if (highlightedPoint) {
				context.fillStyle = hexToRGB(graph.color, this._highlightDimmingAlpha);
			} else {
				context.fillStyle = graph.color;
			}

			range.forEach((point, index) => {
				if (typeof yPixelsStack[index] === 'undefined') {
					yPixelsStack[index] = yScale.getPixelsByValue(0);
				}

				if (typeof prevXPixels === 'undefined') {
					prevXPixels = xScale.getPixelsByValue(point.x);
				}

				let nextX;
				if (range[index + 1]) {
					nextX = range[index + 1].x;
				} else {
					nextX = xScale.isRangeGiven() ?
						xScale.getRangeEnd() :
						xScale.getEnd();
				}

				let width = round(xScale.getPixelsPerValue() * (nextX - point.x));
				const height = round(yScale.getPixelsPerValue() * point.y) * visibility;

				const xPixels = prevXPixels;
				const yPixels = yPixelsStack[index] - height;
				const rawXPixels = xScale.getPixelsByValue(point.x);

				const xPixelsDiff = round(rawXPixels - xPixels);
				if (xPixelsDiff >= 1 || xPixelsDiff <= -1) {
					width += xPixelsDiff;
				}

				prevXPixels += width;
				yPixelsStack[index] -= height;

				const isHighlighted = highlightedPoint && point.x === highlightedPoint.x;

				if (isHighlighted) {
					context.fillStyle = graph.color;
				}

				context.fillRect(xPixels, yPixels, width, height);

				if (isHighlighted) {
					context.fillStyle = hexToRGB(graph.color, this._highlightDimmingAlpha);
				}
			});
		});
	}

	/**
	 * @override
	 */
	drawOverlays() {}
}
