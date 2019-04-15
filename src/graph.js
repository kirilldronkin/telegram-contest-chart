import Point from './point.js';
import {findMax, findMin} from './utils.js';

const {floor} = Math;

/**
 * @enum {string}
 */
export const InterpolationType = {
	NONE: 'none',
	NEIGHBOR: 'neighbor',
	LINEAR: 'linear'
};

export default class Graph {
	/**
	 * @param {string} name
	 * @param {string} color
	 * @param {Array<Point>} points
	 */
	constructor(name, color, points) {
		/**
		 * @type {string}
		 */
		this.name = name;

		/**
		 * @type {string}
		 */
		this.color = color;

		/**
		 * @type {Array<Point>}
		 */
		this.points = points;
	}

	/**
	 * @return {number}
	 */
	getMinX() {
		return findMin(this.points, (point) => point.x, {
			sorted: true
		});
	}

	/**
	 * @return {number}
	 */
	getMinY() {
		return findMin(this.points, (point) => point.y);
	}

	/**
	 * @return {number}
	 */
	getMaxX() {
		return findMax(this.points, (point) => point.x, {
			sorted: true
		});
	}

	/**
	 * @return {number}
	 */
	getMaxY() {
		return findMax(this.points, (point) => point.y);
	}

	/**
	 * @param {number} start
	 * @param {number} end
	 * @param {{
	 *     interpolation: (InterpolationType|undefined)
	 * }=} opt
	 * @return {!Array<Point>}
	 */
	getRange(start, end, {interpolation = InterpolationType.NONE} = {}) {
		if (!this.points.length) {
			return [];
		}

		let startPointIndex;
		let endPointIndex;

		startPointIndex = findIndex(start, this.points, (x, index) => {
			const prev = this.points[index - 1];

			return x >= start && (!prev || prev.x < start);
		});

		if (startPointIndex === -1) {
			startPointIndex = 0;
		}

		const tail = this.points.slice(startPointIndex);

		endPointIndex = findIndex(end, tail, (x, index) => {
			const next = tail[index + 1];

			return x <= end && (!next || next.x > end);
		});

		if (endPointIndex === -1) {
			const lastPointIndex = this.points.length - 1;
			if (end > this.points[lastPointIndex].x) {
				endPointIndex = lastPointIndex;
			} else {
				endPointIndex = startPointIndex;
			}
		} else {
			endPointIndex = startPointIndex + endPointIndex;
		}

		const range = this.points.slice(startPointIndex, endPointIndex + 1);

		if (interpolation !== InterpolationType.NONE) {
			const startPoint = this.points[startPointIndex];
			const endPoint = this.points[endPointIndex];

			if (startPoint.x !== start) {
				const pointBeforeStart = this.points[startPointIndex - 1];

				if (pointBeforeStart) {
					let interpolatedPoint;
					if (interpolation === InterpolationType.LINEAR) {
						interpolatedPoint = interpolateLinear(start, pointBeforeStart, startPoint);
					} else {
						interpolatedPoint = new Point(start, pointBeforeStart.y, {
							isInterpolated: true
						});
					}

					range.unshift(interpolatedPoint);
				}
			}

			if (endPoint.x !== end && !(endPoint === startPoint && startPoint.x > end)) {
				const pointAfterEnd = this.points[endPointIndex + 1];

				if (pointAfterEnd) {
					let interpolatedPoint;
					if (interpolation === InterpolationType.LINEAR) {
						interpolatedPoint = interpolateLinear(end, endPoint, pointAfterEnd);
					} else {
						interpolatedPoint = new Point(end, pointAfterEnd.y, {
							isInterpolated: true
						});
					}

					range.push(interpolatedPoint);
				}
			}
		}

		return range;
	}
}

/**
 * @param {number} x
 * @param {Point} pointA
 * @param {Point} pointB
 * @return {Point}
 */
function interpolateLinear(x, pointA, pointB) {
	const y = pointA.y + (x - pointA.x) * ((pointB.y - pointA.y) / (pointB.x - pointA.x));

	return new Point(x, y, {
		isInterpolated: true
	});
}

/**
 * @param {number} x
 * @param {Array<Point>} points
 * @param {function(number, number): boolean} predicate
 * @return {number}
 */
function findIndex(x, points, predicate) {
	let start = 0;
	let stop = points.length - 1;
	let middle = floor((start + stop) / 2);

	let isFound;
	while (points[middle] && !(isFound = predicate(points[middle].x, middle)) && start < stop) {
		if (x < points[middle].x) {
			stop = middle - 1;
		} else {
			start = middle + 1;
		}

		middle = floor((start + stop) / 2);
	}

	return isFound ? middle : -1;
}
