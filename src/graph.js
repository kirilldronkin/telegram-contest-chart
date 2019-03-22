import Point from './point.js';
import {findMax, findMin} from './utils.js';

const {floor} = Math;

export default class Graph {
	constructor(name, color, points) {
		this.name = name;
		this.color = color;
		this.points = points;
	}

	getMin() {
		return {
			x: findMin(this.points, (point) => point.x),
			y: findMin(this.points, (point) => point.y)
		};
	}

	getMax() {
		return {
			x: findMax(this.points, (point) => point.x),
			y: findMax(this.points, (point) => point.y)
		};
	}

	getRange(startX, endX) {
		if (!this.points.length || startX === endX) {
			return [];
		}

		const startPointIndex = findIndexByX(this.points, startX, (x, index) => {
			const prev = this.points[index - 1];

			return x >= startX && (!prev || prev.x < startX);
		});

		const restPoints = this.points.slice(startPointIndex);
		const endPointIndex = startPointIndex + findIndexByX(restPoints, endX, (x, index) => {
			const next = restPoints[index + 1];

			return x <= endX && (!next || next.x > endX);
		});

		const rangePoints = this.points.slice(startPointIndex, endPointIndex + 1);

		const startPoint = this.points[startPointIndex];
		if (startPoint.x !== startX) {
			const pointBeforeStart = this.points[startPointIndex - 1];
			if (pointBeforeStart) {
				rangePoints.unshift(interpolate(startX, pointBeforeStart, startPoint));
			}
		}

		const endPoint = this.points[endPointIndex];
		if (endPoint.x !== endX) {
			const pointAfterEnd = this.points[endPointIndex + 1];
			if (pointAfterEnd) {
				rangePoints.push(interpolate(endX, endPoint, pointAfterEnd));
			}
		}

		return rangePoints;
	}
}

function interpolate(x, point1, point2) {
	const y = point1.y + (x - point1.x) * ((point2.y - point1.y) / (point2.x - point1.x));

	return new Point(x, y, {
		interpolated: true
	});
}

function findIndexByX(points, x, predicate) {
	let start = 0;
	let stop = points.length - 1;
	let middle = floor((start + stop) / 2);

	let isFound;
	while (!(isFound = predicate(points[middle].x, middle)) && start < stop) {
		if (x < points[middle].x) {
			stop = middle - 1;
		} else {
			start = middle + 1;
		}

		middle = floor((start + stop) / 2);
	}

	return isFound ? middle : null;
}
