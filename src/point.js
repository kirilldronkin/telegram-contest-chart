export default class Point {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {{
	 *     isInterpolated: (boolean|undefined)
	 * }=} opt
	 */
	constructor(x, y, {isInterpolated = false} = {}) {
		/**
		 * @type {number}
		 */
		this.x = x;

		/**
		 * @type {number}
		 */
		this.y = y;

		/**
		 * @type {boolean}
		 */
		this.isInterpolated = isInterpolated;
	}
}
