import Point from './point.js';
import {findMax, findMin} from './utils.js';

const {floor} = Math;

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
	 * @return {{x: number, y: number}}
	 */
	getMin() {
		return {
			x: findMin(this.points, (point) => point.x),
			y: findMin(this.points, (point) => point.y)
		};
	}

	/**
	 * @return {{x: number, y: number}}
	 */
	getMax() {
		return {
			x: findMax(this.points, (point) => point.x),
			y: findMax(this.points, (point) => point.y)
		};
	}

	/**
	 * @param {number} startX
	 * @param {number} endX
	 * @return {Array<Point>}
	 */
	getRange(startX, endX) {
		if (!this.points.length || startX === endX) {
			return [];
		}

		let startPointIndex = findIndexByX(startX, this.points, (x, index) => {
			const prev = this.points[index - 1];

			return x >= startX && (!prev || prev.x < startX);
		});

		if (startPointIndex === -1) {
			startPointIndex = 0;
		}

		const restPoints = this.points.slice(startPointIndex);

		let endPointIndex = findIndexByX(endX, restPoints, (x, index) => {
			const next = restPoints[index + 1];

			return x <= endX && (!next || next.x > endX);
		});

		if (endPointIndex === -1) {
			const lastPointIndex = this.points.length - 1;
			if (endX > this.points[lastPointIndex].x) {
				endPointIndex = lastPointIndex;
			} else {
				endPointIndex = startPointIndex;
			}
		} else {
			endPointIndex = startPointIndex + endPointIndex;
		}

		const rangePoints = this.points.slice(startPointIndex, endPointIndex + 1);

		const startPoint = this.points[startPointIndex];
		if (startPoint.x !== startX) {
			const pointBeforeStart = this.points[startPointIndex - 1];
			if (pointBeforeStart) {
				rangePoints.unshift(pointBeforeStart.interpolate(startX, startPoint));
			}
		}

		const endPoint = this.points[endPointIndex];
		if (endPoint.x !== endX && !(endPoint === startPoint && startPoint.x > endX)) {
			const pointAfterEnd = this.points[endPointIndex + 1];
			if (pointAfterEnd) {
				rangePoints.push(endPoint.interpolate(endX, pointAfterEnd));
			}
		}

		return rangePoints;
	}
}

/**
 * @param {number} x
 * @param {Array<Point>} points
 * @param {function(number, number): boolean} predicate
 * @return {number}
 */
function findIndexByX(x, points, predicate) {
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
