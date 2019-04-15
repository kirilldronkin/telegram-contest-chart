import IScale from './i-scale.js';
import Point from '../point.js';
import Graph, {InterpolationType} from '../graph.js';
import {Timing} from '../transition.js';

/**
 * @typedef {{
 *     getGraphRange: function(Graph): Array<Point>,
 *     getGraphVisibility: function(Graph): number,
 *     getGraphHighlightedPoint: function(Graph): ?Point,
 * }}
 */
export let DrawHelpers;

/**
 * @template OPTIONS_TYPE
 * @interface
 */
export default class IView {
	/**
	 * @param {OPTIONS_TYPE=} options
	 */
	setOptions(options) {}

	/**
	 * @return {InterpolationType}
	 */
	getInterpolationType() {}

	/**
	 * @return {Timing}
	 */
	getFadeInTransitionTiming() {}

	/**
	 * @return {Timing}
	 */
	getFadeOutTransitionTiming() {}

	/**
	 * @param {Point} start
	 * @param {Point} middle
	 * @param {Point} end
	 * @return {Point}
	 */
	selectHighlightedPoint(start, middle, end) {}

	/**
	 * @param {Array<Graph>} graphs
	 * @return {number}
	 */
	findYScaleStart(graphs) {}

	/**
	 * @param {Array<Graph>} graphs
	 * @return {number}
	 */
	findYScaleEnd(graphs) {}

	/**
	 * @param {Array<Array<Point>>} ranges
	 * @return {number}
	 */
	findYScaleRangeStart(ranges) {}

	/**
	 * @param {Array<Array<Point>>} ranges
	 * @return {number}
	 */
	findYScaleRangeEnd(ranges) {}

	/**
	 * @param {CanvasRenderingContext2D} context
	 * @param {IScale} xScale
	 * @param {IScale} yScale
	 * @param {Array<Graph>} graphs
	 * @param {DrawHelpers} helpers
	 */
	draw(context, xScale, yScale, graphs, helpers) {}

	/**
	 * @param {CanvasRenderingContext2D} context
	 * @param {IScale} xScale
	 * @param {IScale} yScale
	 * @param {Array<Graph>} graphs
	 * @param {DrawHelpers} helpers
	 */
	drawOverlays(context, xScale, yScale, graphs, helpers) {}
}
