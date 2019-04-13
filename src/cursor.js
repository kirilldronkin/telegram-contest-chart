import Point from './point.js';
import Graph from './graph.js';
import Chart, {Axis, TicksType, ViewType} from './chart.js';
import Toolbar from './ui/toolbar.js';
import {
	createDivElement,
	clamp,
	debounce,
	throttle,
	getEventX,
	getEventY,
	isPassiveEventsSupported,
	formatDay,
	to12Hours,
	getShortWeekDayName
} from './utils.js';

/**
 * @const {number}
 */
const LABEL_MARGIN = 10;

/**
 * @const {number}
 */
const LABEL_FILL_BACKPRESSURE_TIME = 100;

export default class Cursor {
	constructor() {
		/**
		 * @type {?Chart}
		 * @private
		 */
		this._chart = null;

		/**
		 * @type {?HTMLCanvasElement}
		 * @private
		 */
		this._canvas = null;

		/**
		 * @type {number}
		 * @private
		 */
		this._canvasWidth = NaN;

		/**
		 * @type {number}
		 * @private
		 */
		this._canvasHeight = NaN;

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._toolbarContainer = createDivElement();

		/**
		 * @type {Toolbar}
		 * @private
		 */
		this._toolbar = new Toolbar(this._toolbarContainer);

		/**
		 * @type {number}
		 * @private
		 */
		this._lastMoveX = NaN;

		/**
		 * @type {?(MouseEvent|TouchEvent)}
		 * @private
		 */
		this._lastMoveEvent = null;

		/**
		 * @type {boolean}
		 * @private
		 */
		this._isMyDrawing = false;

		/**
		 * @type {function(number, Map<Graph, Point>)}
		 * @private
		 */
		this._fillToolbarThrottled = throttle(this._fillToolbar.bind(this), LABEL_FILL_BACKPRESSURE_TIME);

		/**
		 * @type {function(number, Map<Graph, Point>)}
		 * @private
		 */
		this._fillToolbarDebounced = debounce(this._fillToolbar.bind(this), LABEL_FILL_BACKPRESSURE_TIME);

		/**
		 * @type {function()}
		 * @private
		 */
		this._onDrawBinded = this._onDraw.bind(this);

		/**
		 * @type {function(Event)}
		 * @private
		 */
		this._onMoveBinded = this._onMove.bind(this);

		/**
		 * @type {function()}
		 * @private
		 */
		this._onMouseLeaveBinded = this._onMouseLeave.bind(this);

		/**
		 * @type {function()}
		 * @private
		 */
		this._onTouchEndBinded = this._onTouchEnd.bind(this);
	}

	/**
	 * @param {Chart} chart
	 */
	observe(chart) {
		if (this._canvas) {
			this._chart.removeDrawListener(this._onDrawBinded);

			this._canvas.removeChild(this._toolbarContainer);
			this._canvas.removeEventListener('mousemove', this._onMoveBinded);
			this._canvas.removeEventListener('mouseleave', this._onMouseLeaveBinded);
			this._canvas.removeEventListener('touchmove', this._onMoveBinded);
			this._canvas.removeEventListener('touchend', this._onTouchEndBinded);
		}

		this._chart = chart;
		this._chart.addDrawListener(this._onDrawBinded);

		this._canvas = chart.getCanvas();
		this._canvasWidth = this._canvas.offsetWidth;
		this._canvasHeight = this._canvas.offsetHeight;

		this._canvas.parentElement.appendChild(this._toolbarContainer);
		this._canvas.addEventListener('mousemove', this._onMoveBinded);
		this._canvas.addEventListener('mouseleave', this._onMouseLeaveBinded);
		this._canvas.addEventListener('touchend', this._onTouchEndBinded);
		this._canvas.addEventListener('touchmove', this._onMoveBinded, isPassiveEventsSupported() && {
			passive: true
		});

		this._hideToolbar();
	}

	resize() {
		if (this._canvas) {
			this._canvasWidth = this._canvas.offsetWidth;
			this._canvasHeight = this._canvas.offsetHeight;
		}
	}

	/**
	 * @param {number} x
	 * @param {Map<Graph, Point>} graphToHighlightedPoint
	 * @param {number} leftOffset
	 * @param {number} topOffset
	 * @private
	 */
	_showToolbar(x, graphToHighlightedPoint, leftOffset, topOffset) {
		this._fillToolbarThrottled(x, graphToHighlightedPoint);
		this._fillToolbarDebounced(x, graphToHighlightedPoint);

		this._toolbarContainer.style.display = 'block';

		const toolbarWidth = this._toolbarContainer.offsetWidth;
		const toolbarHeight = this._toolbarContainer.offsetHeight;

		const adjustedLeftOffset = clamp(leftOffset - (toolbarWidth + LABEL_MARGIN), 0, this._canvasWidth);
		const adjustedTopOffset = clamp(topOffset - toolbarHeight, 0, this._canvasHeight - toolbarHeight);

		this._toolbarContainer.style.transform = `translate(${adjustedLeftOffset}px, ${adjustedTopOffset}px)`;
	}

	/**
	 * @param {number} x
	 * @param {Map<Graph, Point>} graphToHighlightedPoint
	 * @private
	 */
	_fillToolbar(x, graphToHighlightedPoint) {
		let title;
		if (this._chart.getAxisTicksType(Axis.X) === TicksType.DATE) {
			const xDate = new Date(x);
			const ticksSpacing = this._chart.getAxisTicksSpacing(Axis.X);
			const msInDay = 100 * 60 * 60 * 24;

			if (ticksSpacing / msInDay >= 1) {
				title = `${getShortWeekDayName(xDate.getDay())}, ${formatDay(xDate)}`;
			} else {
				title = to12Hours(xDate);
			}
		} else {
			title = String(x);
		}

		const items = Array.from(graphToHighlightedPoint.entries())
			.sort((entryA, entryB) => entryB[1].y - entryA[1].y)
			.map(([graph, point]) => ({
				title: graph.name,
				color: graph.color,
				value: String(point.y)
			}));

		this._toolbar.setTitle(title);
		this._toolbar.setItems(items);
	}

	/**
	 * @private
	 */
	_hideToolbar() {
		this._toolbarContainer.style.display = 'none';
	}

	/**
	 * @private
	 */
	_reset() {
		this._hideToolbar();

		this._chart.highlight(NaN);
		this._chart.removeRulers();
		this._chart.draw();

		this._lastMoveX = NaN;
		this._lastMoveEvent = null;
	}

	/**
	 * @private
	 */
	_onDraw() {
		if (!this._isMyDrawing && this._lastMoveX) {
			this._isMyDrawing = true;
			this._reset();
			this._isMyDrawing = false;
		}
	}

	/**
	 * @param {Event} event
	 * @private
	 */
	_onMove(event) {
		event = /** @type {MouseEvent|TouchEvent} */ (event);

		const canvasRect = this._canvas.getBoundingClientRect();
		const canvasX = getEventX(event, this._canvas) - canvasRect.left;
		const canvasY = getEventY(event, this._canvas) - canvasRect.top;

		if (canvasX === this._lastMoveX) {
			return;
		}

		this._chart.highlight(canvasX);

		const graphs = this._chart.getGraphs();
		const graphToHighlightedPoint = new Map();

		graphs.forEach((graph) => {
			const highlightedPoint = this._chart.getGraphHighlightedPoint(graph);
			if (highlightedPoint) {
				graphToHighlightedPoint.set(graph, highlightedPoint);
			}
		});

		if (!graphToHighlightedPoint.size) {
			return;
		}

		const rulerXs = [];

		Array.from(graphToHighlightedPoint.entries())
			.forEach(([graph, point]) => {
				const viewType = this._chart.getGraphViewType(graph);
				const isRulerNeeded = viewType === ViewType.LINE || viewType === ViewType.AREA;

				if (isRulerNeeded && !rulerXs.includes(point.x)) {
					rulerXs.push(point.x);
				}
			});

		this._chart.removeRulers();
		rulerXs.forEach((x) => {
			this._chart.addRuler(x);
		});

		this._isMyDrawing = true;
		this._chart.draw();
		this._isMyDrawing = false;

		this._showToolbar(this._chart.getXByPixels(canvasX), graphToHighlightedPoint, canvasX, canvasY);

		this._lastMoveX = canvasX;
		this._lastMoveEvent = event;
	}

	/**
	 * @private
	 */
	_onMouseLeave() {
		this._reset();
	}

	/**
	 * @private
	 */
	_onTouchEnd() {
		if (this._lastMoveEvent instanceof TouchEvent) {
			this._reset();
		}
	}
}
