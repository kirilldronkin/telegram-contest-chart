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

	/**
	 * @param {number} x
	 * @param {Point} point
	 */
	interpolate(x, point) {
		const y = this.y + (x - this.x) * ((point.y - this.y) / (point.x - this.x));

		return new Point(x, y, {
			isInterpolated: true
		});
	}
}
