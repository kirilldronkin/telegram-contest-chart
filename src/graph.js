import Point from './point.js';
import {findMax, findMin} from './utils.js';

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
		const rangePoints = this.points.filter((point) => point.x >= startX && point.x <= endX);

		const startPoint = rangePoints[0];
		const startPointIndex = this.points.indexOf(startPoint);

		const endPoint = rangePoints[rangePoints.length - 1];
		const endPointIndex = this.points.indexOf(endPoint);

		if (startPoint.x !== startX) {
			const pointBeforeMin = this.points[startPointIndex - 1];
			if (pointBeforeMin) {
				rangePoints.unshift(interpolate(startX, pointBeforeMin, startPoint));
			}
		}

		if (endPoint.x !== endX) {
			const pointAfterMax = this.points[endPointIndex + 1];
			if (pointAfterMax) {
				rangePoints.push(interpolate(endX, endPoint, pointAfterMax));
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
