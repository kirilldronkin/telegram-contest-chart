import IView from '../interfaces/i-view.js';
import IScale from '../interfaces/i-scale.js';
import {InterpolationType} from '../graph.js';
import {findMin, findMax, identity, hexToRGB} from '../utils.js';

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
	 * @override
	 */
	selectHighlightedPoint(start) {
		return start;
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
		let yScaleEnd = this._yScale.getEnd();

		for (let i = 0; i < graph.points.length; i++) {
			const ySum = otherGraphs.concat(graph)
				.reduce((acc, someGraph) => acc + someGraph.points[i].y, 0);

			if (isNaN(yScaleEnd) || ySum > yScaleEnd) {
				yScaleEnd = ySum;
			}
		}

		this._yScale.setStart(0);
		this._yScale.setEnd(yScaleEnd);

		if (this._xScale.isRangeGiven()) {
			const range = getGraphRange(graph);
			const otherRanges = otherGraphs.map((otherGraph) => getGraphRange(otherGraph));

			let yScaleRangeEnd = this._yScale.getRangeEnd();

			for (let i = 0; i < range.length; i++) {
				const ySum = otherRanges.concat(range)
					.reduce((acc, range) => acc + range[i].y, 0);

				if (isNaN(yScaleRangeEnd) || ySum > yScaleRangeEnd) {
					yScaleRangeEnd = ySum;
				}
			}

			this._yScale.setRangeStart(0);
			this._yScale.setRangeEnd(yScaleRangeEnd);
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
		let yScaleEnd = NaN;

		if (otherGraphs.length) {
			for (let i = 0; i < graph.points.length; i++) {
				const ySum = otherGraphs.reduce((acc, someGraph) => acc + someGraph.points[i].y, 0);

				if (isNaN(yScaleEnd) || ySum > yScaleEnd) {
					yScaleEnd = ySum;
				}
			}
		}

		this._yScale.setStart(otherGraphs.length ? 0 : NaN);
		this._yScale.setEnd(yScaleEnd);

		if (this._xScale.isRangeGiven()) {
			const range = getGraphRange(graph);
			const otherRanges = otherGraphs.map((otherGraph) => getGraphRange(otherGraph));

			let yScaleRangeEnd = this._yScale.getRangeEnd();

			for (let i = 0; i < range.length; i++) {
				const ySum = otherRanges.reduce((acc, range) => acc + range[i].y, 0);

				if (isNaN(yScaleRangeEnd) || ySum > yScaleRangeEnd) {
					yScaleRangeEnd = ySum;
				}
			}

			this._yScale.setRangeStart(otherRanges.length ? 0 : NaN);
			this._yScale.setRangeEnd(yScaleRangeEnd);
		}
	}

	/**
	 * @override
	 */
	updateYScaleRange(graphs, {getGraphRange}) {
		const ranges = graphs.map((graph) => getGraphRange(graph));

		let yScaleRangeEnd = this._yScale.getRangeEnd();

		if (ranges.length) {
			for (let i = 0; i < ranges[0].length; i++) {
				const ySum = ranges.reduce((acc, range) => acc + range[i].y, 0);

				if (isNaN(yScaleRangeEnd) || ySum > yScaleRangeEnd) {
					yScaleRangeEnd = ySum;
				}
			}
		}

		this._yScale.setRangeStart(ranges.length ? 0 : NaN);
		this._yScale.setRangeEnd(yScaleRangeEnd);
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

		const yPixelsSums = [];

		graphs.forEach((graph) => {
			const range = getGraphRange(graph);
			const visibility = getGraphVisibility(graph);
			const highlightedPoint = getGraphHighlightedPoint(graph);

			let prevXPixels;

			if (highlightedPoint) {
				this._context.fillStyle = hexToRGB(graph.color, this._highlightDimmingAlpha);
			} else {
				this._context.fillStyle = graph.color;
			}

			range.forEach((point, index) => {
				if (!yPixelsSums[index]) {
					yPixelsSums[index] = this._yScale.getPixelsByValue(0);
				}

				if (!prevXPixels) {
					prevXPixels = this._xScale.getPixelsByValue(point.x);
				}

				let nextX;
				if (range[index + 1]) {
					nextX = range[index + 1].x;
				} else {
					nextX = this._xScale.isRangeGiven() ?
						this._xScale.getRangeEnd() :
						this._xScale.getEnd();
				}

				let width = round(this._xScale.getPixelsPerValue() * (nextX - point.x));
				const height = round(this._yScale.getPixelsPerValue() * point.y) * visibility;

				const xPixels = prevXPixels;
				const yPixels = yPixelsSums[index] - height;
				const actualXPixels = this._xScale.getPixelsByValue(point.x);

				const xPixelsDiff = round(actualXPixels - xPixels);
				if (xPixelsDiff >= 1 || xPixelsDiff <= -1) {
					width += xPixelsDiff;
				}

				prevXPixels += width;
				yPixelsSums[index] -= height;

				const isHighlighted = highlightedPoint && point.x === highlightedPoint.x;

				if (isHighlighted) {
					this._context.fillStyle = graph.color;
				}

				this._context.fillRect(xPixels, yPixels, width, height);

				if (isHighlighted) {
					this._context.fillStyle = hexToRGB(graph.color, this._highlightDimmingAlpha);
				}
			});
		});

		this._context.restore();
	}
}
