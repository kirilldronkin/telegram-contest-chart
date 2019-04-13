/**
 * @interface
 */
export default class IScale {
	/**
	 * @param {number} dimension
	 */
	setDimension(dimension) {}

	/**
	 * @return {number}
	 */
	getDimension() {}

	/**
	 * @param {Array<number>} padding
	 */
	setPadding(padding) {}

	/**
	 * @return {Array<number>}
	 */
	getPadding() {}

	/**
	 * @param {number} count
	 */
	setTicksCount(count) {}

	/**
	 * @return {number}
	 */
	getTicksCount() {}

	/**
	 * @param {number} start
	 */
	setStart(start) {}

	/**
	 * @return {number}
	 */
	getStart() {}

	/**
	 * @param {number} end
	 */
	setEnd(end) {}

	/**
	 * @return {number}
	 */
	getEnd() {}

	/**
	 * @param {number} start
	 */
	setRangeStart(start) {}

	/**
	 * @return {number}
	 */
	getRangeStart() {}

	/**
	 * @param {number} end
	 */
	setRangeEnd(end) {}

	/**
	 * @return {number}
	 */
	getRangeEnd() {}

	/**
	 * @return {number}
	 */
	getFitStart() {}

	/**
	 * @return {number}
	 */
	getFitEnd() {}

	/**
	 * @return {number}
	 */
	getTicksSpacing() {}

	/**
	 * @return {number}
	 */
	getPixelsPerValue() {}

	/**
	 * @param {number} pixels
	 * @return {number}
	 * @param {{
	 *     fit: (boolean|undefined)
	 * }=} opt
	 */
	getValueByPixels(pixels, opt) {}

	/**
	 * @param {number} value
	 * @param {{
	 *     fit: (boolean|undefined)
	 * }=} opt
	 * @return {number}
	 */
	getPixelsByValue(value, opt) {}

	/**
	 * @param {number} duration
	 */
	setTransitionDuration(duration) {}

	/**
	 * @param {{
	 *     onStart: (function(number, number)|undefined),
	 *     onProgress: (function(number)|undefined),
	 *     onUpdate: (function()|undefined),
	 *     onComplete: (function()|undefined),
	 * }=} opt
	 */
	setTransitionListeners({onStart, onProgress, onUpdate, onComplete}) {}

	startTransition() {}

	stopTransition() {}

	/**
	 * @return {boolean}
	 */
	isEmpty() {}

	/**
	 * @return {boolean}
	 */
	isRangeGiven() {}

	/**
	 * @return {boolean}
	 */
	isRangeEmpty() {}

	/**
	 * @return {boolean}
	 */
	isStartReached() {}

	/**
	 * @return {boolean}
	 */
	isEndReached() {}

	fit() {}

	clear() {}
}
