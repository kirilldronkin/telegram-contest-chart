import Chart, {Axis, TicksType} from './chart.js';
import Graph from './graph.js';
import Point from './point.js';
import Label from './ui/label.js';
import {createDiv, clamp} from './utils.js';

const {abs} = Math;

/**
 * @const {number}
 */
const LABEL_MARGIN = 10;

export default class Cursor {
	constructor() {
		/**
		 * @type {?HTMLCanvasElement}
		 * @private
		 */
		this._canvas = null;

		/**
		 * @type {?Chart}
		 * @private
		 */
		this._chart = null;

		/**
		 * @type {Array<HTMLDivElement>}
		 * @private
		 */
		this._markers = [];

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._ruler = createDiv('cursor__ruler');

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._labelContainer = createDiv();

		/**
		 * @type {Label}
		 * @private
		 */
		this._label = new Label(this._labelContainer);

		/**
		 * @type {function(Event)}
		 * @private
		 */
		this._onMouseMoveBinded = this._onMouseMove.bind(this);

		/**
		 * @type {function()}
		 * @private
		 */
		this._onMouseLeaveBinded = this._onMouseLeave.bind(this);
	}

	/**
	 * @param {Chart} chart
	 */
	observe(chart) {
		if (this._canvas) {
			this._canvas.removeEventListener('mousemove', this._onMouseMoveBinded);
			this._canvas.removeEventListener('mouseleave', this._onMouseLeaveBinded);
		}

		this._canvas = chart.getCanvas();
		this._canvas.addEventListener('mousemove', this._onMouseMoveBinded);
		this._canvas.addEventListener('mouseleave', this._onMouseLeaveBinded);

		this._chart = chart;
	}

	clear() {
		if (this._markers.length) {
			this._removeAllMarkers();
			this._removeRuler();
			this._removeLabel();
		}
	}

	/**
	 * @param {Graph} graph
	 * @param {Point} point
	 * @private
	 */
	_addMarker(graph, point) {
		const marker = createDiv('cursor__marker');

		marker.style.borderColor = graph.color;
		marker.style.left = `${this._chart.getPixelsByX(point.x)}px`;
		marker.style.top = `${this._chart.getPixelsByY(point.y)}px`;

		this._canvas.appendChild(marker);
		this._markers.push(marker);
	}

	/**
	 * @private
	 */
	_removeAllMarkers() {
		this._markers.forEach((marker) => {
			this._canvas.removeChild(marker);
		});
		this._markers.length = 0;
	}

	/**
	 * @param {number} offset
	 * @private
	 */
	_addRuler(offset) {
		const chartTopPadding = this._chart.getTopPadding();
		const chartBottomPadding = this._chart.getBottomPadding();

		this._ruler.style.left = `${offset}px`;
		this._ruler.style.top = `${chartTopPadding}px`;
		this._ruler.style.height = `${this._canvas.offsetHeight - chartTopPadding - chartBottomPadding}px`;

		this._canvas.appendChild(this._ruler);
	}

	/**
	 * @private
	 */
	_removeRuler() {
		if (this._canvas.contains(this._ruler)) {
			this._canvas.removeChild(this._ruler);
		}
	}

	/**
	 * @param {number} offset
	 * @param {Point} nearestPoint
	 * @param {Map<Graph, Point>} pointsByGraph
	 * @private
	 */
	_addLabel(offset, nearestPoint, pointsByGraph) {
		let title;
		if (this._chart.getAxisTicksType(Axis.X) === TicksType.DATE) {
			title = new Date(nearestPoint.x).toLocaleDateString('en-us', {
				'weekday': 'short',
				'month': 'short',
				'day': 'numeric',
				'hour': 'numeric',
				'minute': 'numeric'
			});
		} else {
			title = this._chart.formatValue(nearestPoint.x, Axis.X);
		}

		const items = Array.from(pointsByGraph.entries())
			.sort((entryA, entryB) => entryB[1].y - entryA[1].y)
			.map(([graph, point]) => ({
				title: graph.name,
				color: graph.color,
				value: this._chart.formatValue(point.y, Axis.Y)
			}));

		this._label.setTitle(title);
		this._label.setItems(items);

		this._canvas.appendChild(this._labelContainer);

		const areaSize = this._canvas.offsetWidth;
		const labelSize = this._labelContainer.offsetWidth;

		let position;
		if (offset + labelSize + LABEL_MARGIN <= areaSize) {
			position = offset + LABEL_MARGIN;
		} else if (labelSize + LABEL_MARGIN <= offset) {
			position = offset - labelSize - LABEL_MARGIN;
		} else {
			position = clamp(offset - (labelSize / 2), 0, areaSize);
		}

		this._labelContainer.style.left = `${position}px`;
	}

	/**
	 * @private
	 */
	_removeLabel() {
		if (this._canvas.contains(this._labelContainer)) {
			this._canvas.removeChild(this._labelContainer);
		}
	}

	/**
	 * @param {Event} event
	 * @private
	 */
	_onMouseMove(event) {
		event = /** @type {MouseEvent} */ (event);

		const areaBCR = this._canvas.getBoundingClientRect();

		const areaY = event.clientY - areaBCR.top;
		const chartY = this._chart.getYByPixels(areaY);

		const areaX = event.clientX - areaBCR.left;
		const lineThickness = this._chart.getGraphLineThickness();
		const minChartX = this._chart.getXByPixels(areaX - lineThickness);
		const maxChartX = this._chart.getXByPixels(areaX + lineThickness);

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

		this.clear();

		if (foundPointsByGraph.size) {
			let nearestPoint;

			Array.from(foundPointsByGraph.entries())
				.forEach(([graph, point]) => {
					this._addMarker(graph, point);

					if (!nearestPoint || abs(chartY - point.y) < abs(chartY - nearestPoint.y)) {
						nearestPoint = point;
					}
				});

			const offset = this._chart.getPixelsByX(nearestPoint.x);

			this._addRuler(offset);
			this._addLabel(offset, nearestPoint, foundPointsByGraph);
		}
	}

	/**
	 * @private
	 */
	_onMouseLeave() {
		this.clear();
	}
}
