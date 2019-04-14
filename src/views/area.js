import IView from '../interfaces/i-view.js';
import Point from '../point.js';
import {InterpolationType} from '../graph.js';
import {Timing} from '../transition.js';

/**
 * @typedef {undefined}
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
		this.setOptions(options);
	}

	/**
	 * @override
	 */
	setOptions() {}

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
	selectHighlightedPoint(start, middle) {
		return middle;
	}

	/**
	 * @override
	 */
	findYScaleStart(graphs) {
		return graphs.length ? 0 : NaN;
	}

	/**
	 * @override
	 */
	findYScaleEnd(graphs) {
		return graphs.length ? 100 : NaN;
	}

	/**
	 * @override
	 */
	findYScaleRangeStart(ranges) {
		return ranges.length ? 0 : NaN;
	}

	/**
	 * @override
	 */
	findYScaleRangeEnd(ranges) {
		return ranges.length ? 100 : NaN;
	}

	/**
	 * @override
	 */
	draw(context, xScale, yScale, graphs, {getGraphRange, getGraphVisibility}) {
		const ySums = [];
		const yStack = [];

		const bottomPoints = [
			new Point(xScale.getFitEnd(), 0),
			new Point(xScale.getFitStart(), 0)
		];

		context.globalCompositeOperation = 'destination-over';

		graphs.forEach((graph) => {
			const range = getGraphRange(graph);
			const visibility = getGraphVisibility(graph);

			context.beginPath();
			context.fillStyle = graph.color;

			range.forEach((point, index) => {
				if (typeof ySums[index] === 'undefined') {
					ySums[index] = graphs.reduce(
						(acc, graph) => acc + (getGraphRange(graph)[index].y * getGraphVisibility(graph)), 0
					);
				}

				if (typeof yStack[index] === 'undefined') {
					yStack[index] = 0;
				}

				const percents = (point.y / ySums[index] * 100) * visibility;
				const xPixels = xScale.getPixelsByValue(point.x);
				const yPixels = yScale.getPixelsByValue(yStack[index] + percents);

				if (index === 0) {
					context.moveTo(xPixels, yPixels);
				} else {
					context.lineTo(xPixels, yPixels);
				}

				yStack[index] += percents;
			});

			bottomPoints.forEach((point) => {
				context.lineTo(xScale.getPixelsByValue(point.x), yScale.getPixelsByValue(point.y));
			});

			context.fill();
		});
	}
}
