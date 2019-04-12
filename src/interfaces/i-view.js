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
export let Helpers;

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
	 * @param {Graph} graph
	 * @param {Array<Graph>} otherGraphs
	 * @param {Helpers} helpers
	 */
	addGraphToXScale(graph, otherGraphs, helpers) {}

	/**
	 * @param {Graph} graph
	 * @param {Array<Graph>} otherGraphs
	 * @param {Helpers} helpers
	 */
	addGraphToYScale(graph, otherGraphs, helpers) {}

	/**
	 * @param {Graph} graph
	 * @param {Array<Graph>} otherGraphs
	 * @param {Helpers} helpers
	 */
	removeGraphFromXScale(graph, otherGraphs, helpers) {}

	/**
	 * @param {Graph} graph
	 * @param {Array<Graph>} otherGraphs
	 * @param {Helpers} helpers
	 */
	removeGraphFromYScale(graph, otherGraphs, helpers) {}

	/**
	 * @param {Array<Graph>} graphs
	 * @param {Helpers} helpers
	 */
	updateYScaleRange(graphs, helpers) {}

	/**
	 * @param {Array<Graph>} graphs
	 * @param {Helpers} helpers
	 */
	draw(graphs, helpers) {}
}
