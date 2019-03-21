import Label from './ui/label.js';
import {createDiv} from './utils.js';

const {abs} = Math;

const LABEL_MARGIN = 10;
const X_AXIS_HIT_TOLERANCE = 3;

export default class Cursor {
	constructor() {
		this._markers = [];
		this._ruler = createDiv('cursor__ruler');

		this._labelContainer = createDiv();
		this._label = new Label(this._labelContainer);

		this._onMouseMoveBinded = this._onMouseMove.bind(this);
		this._onMouseLeaveBinded = this._onMouseLeave.bind(this);
	}

	observe(chart) {
		if (this._area) {
			this._area.removeEventListener('mousemove', this._onMouseMoveBinded);
			this._area.removeEventListener('mouseleave', this._onMouseLeaveBinded);
		}

		this._chart = chart;

		this._area = chart.getCanvas().parentNode;
		this._area.addEventListener('mousemove', this._onMouseMoveBinded);
		this._area.addEventListener('mouseleave', this._onMouseLeaveBinded);
	}

	_addMarker(graph, point) {
		const marker = createDiv('cursor__marker');

		marker.style.borderColor = graph.color;
		marker.style.left = `${this._chart.getPixelsByX(point.x)}px`;
		marker.style.top = `${this._chart.getPixelsByY(point.y)}px`;

		this._area.appendChild(marker);
		this._markers.push(marker);
	}

	_removeAllMarkers() {
		this._markers.forEach((marker) => {
			this._area.removeChild(marker);
		});
		this._markers.length = 0;
	}

	_addRuler(offset) {
		const chartTopPadding = this._chart.getTopPadding();
		const chartBottomPadding = this._chart.getBottomPadding();

		this._ruler.style.left = `${offset}px`;
		this._ruler.style.top = `${chartTopPadding}px`;
		this._ruler.style.height = `${this._area.offsetHeight - chartTopPadding - chartBottomPadding}px`;

		this._area.appendChild(this._ruler);
	}

	_removeRuler() {
		if (this._area.contains(this._ruler)) {
			this._area.removeChild(this._ruler);
		}
	}

	_addLabel(nearestToCursorPoint, pointsByGraph, offset) {
		this._label.setTitle(nearestToCursorPoint.x instanceof Date ?
				nearestToCursorPoint.x.toLocaleDateString('en-us', {
					'weekday': 'short',
					'month': 'short',
					'day': 'numeric',
					'hour': 'numeric',
					'minute': 'numeric'
				}) :
				this._chart.formatValue(nearestToCursorPoint.x, 'x')
		);

		this._label.setItems(
			Array.from(pointsByGraph.entries())
				.sort((entryA, entryB) => entryB[1].y - entryA[1].y)
				.map(([graph, point]) => ({
					title: graph.name,
					color: graph.color,
					value: this._chart.formatValue(point.y, 'y')
				}))
		);

		this._area.appendChild(this._labelContainer);

		let position;
		if (offset + this._labelContainer.offsetWidth > this._area.offsetWidth) {
			position = offset - this._labelContainer.offsetWidth - LABEL_MARGIN;
		} else {
			position = offset + LABEL_MARGIN;
		}

		this._labelContainer.style.left = `${position}px`;
	}

	_removeLabel() {
		if (this._area.contains(this._labelContainer)) {
			this._area.removeChild(this._labelContainer);
		}
	}

	_onMouseMove(event) {
		const areaBCR = this._area.getBoundingClientRect();

		const areaX = event.clientX - areaBCR.left;
		const areaY = event.clientY - areaBCR.top;

		const chartY = this._chart.getYByPixels(areaY);
		const minChartX = this._chart.getXByPixels(areaX - X_AXIS_HIT_TOLERANCE);
		const maxChartX = this._chart.getXByPixels(areaX + X_AXIS_HIT_TOLERANCE);

		const drawnGraphs = this._chart.getGraphs();
		const foundPointsByGraph = new Map();

		drawnGraphs.forEach((graph) => {
			const point = graph.points.find((point) =>
				point.x >= minChartX && point.x <= maxChartX
			);

			if (point && !point.interpolated) {
				foundPointsByGraph.set(graph, point);
			}
		});

		this._removeLabel();
		this._removeRuler();
		this._removeAllMarkers();

		if (foundPointsByGraph.size) {
			let nearestToCursorPoint;

			Array.from(foundPointsByGraph.entries())
				.forEach(([graph, point]) => {
					this._addMarker(graph, point);

					if (!nearestToCursorPoint || abs(chartY - point.y) < abs(chartY - nearestToCursorPoint.y)) {
						nearestToCursorPoint = point;
					}
				});

			const offset = this._chart.getPixelsByX(nearestToCursorPoint.x);

			this._addRuler(offset);
			this._addLabel(nearestToCursorPoint, foundPointsByGraph, offset);
		}
	}

	_onMouseLeave() {
		this._removeLabel();
		this._removeRuler();
		this._removeAllMarkers();
	}
}
