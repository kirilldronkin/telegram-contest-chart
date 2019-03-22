export default class Point {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {{
	 *     interpolated: (boolean|undefined)
	 * }=} opt
	 */
	constructor(x, y, {interpolated = false} = {}) {
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
		this.interpolated = interpolated;
	}
}
