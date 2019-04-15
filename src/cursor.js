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

/**
 * @typedef {Array<{
 *     viewType: ViewType,
 *     graphsWithPoint: Array<{graph: Graph, point: Point}>
 * }>}
 */
let ToolbarEntries;

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
		 * @type {number}
		 * @private
		 */
		this._rafId = NaN;

		/**
		 * @type {function(number, ToolbarEntries)}
		 * @private
		 */
		this._fillToolbarThrottled = throttle(this._fillToolbar.bind(this), LABEL_FILL_BACKPRESSURE_TIME);

		/**
		 * @type {function(number, ToolbarEntries)}
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
	 * @private
	 */
	_drawChart() {
		this._isMyDrawing = true;
		this._chart.draw();
		this._isMyDrawing = false;
	}

	/**
	 * @param {number} x
	 * @param {ToolbarEntries} entries
	 * @param {number} leftOffset
	 * @param {number} topOffset
	 * @private
	 */
	_showToolbar(x, entries, leftOffset, topOffset) {
		this._fillToolbarThrottled(x, entries);
		this._fillToolbarDebounced(x, entries);

		this._toolbarContainer.style.display = 'block';

		const toolbarWidth = this._toolbarContainer.offsetWidth;
		const toolbarHeight = this._toolbarContainer.offsetHeight;

		const adjustedLeftOffset = clamp(leftOffset - (toolbarWidth + LABEL_MARGIN), 0, this._canvasWidth);
		const adjustedTopOffset = clamp(topOffset - toolbarHeight, 0, this._canvasHeight - toolbarHeight);

		this._toolbarContainer.style.transform = `translate(${adjustedLeftOffset}px, ${adjustedTopOffset}px)`;
	}

	/**
	 * @param {number} x
	 * @param {ToolbarEntries} entries
	 * @private
	 */
	_fillToolbar(x, entries) {
		let title;
		if (this._chart.getAxisTicksType(Axis.X) === TicksType.DATE) {
			const xDate = new Date(x);
			const msInDay = 100 * 60 * 60 * 24;
			const ticksSpacing = this._chart.getAxisTicksSpacing(Axis.X);

			if (ticksSpacing / msInDay >= 1) {
				title = `${getShortWeekDayName(xDate.getDay())}, ${formatDay(xDate)}`;
			} else {
				title = to12Hours(xDate);
			}
		} else {
			title = String(x);
		}

		const columns = [];
		entries.forEach(({viewType, graphsWithPoint}) => {
			let ySum;
			if (viewType === ViewType.BAR || viewType === ViewType.AREA) {
				ySum = graphsWithPoint.reduce((acc, {point}) => acc + point.y, 0);
			}

			graphsWithPoint.forEach(({graph, point}) => {
				columns.push({
					name: graph.name,
					color: graph.color,
					value: point.y,
					percentage: viewType === ViewType.AREA ? point.y / ySum * 100 : undefined
				});
			});

			if (viewType === ViewType.BAR && graphsWithPoint.length > 1) {
				columns.push({
					name: 'All',
					color: '#fff',
					value: ySum
				});
			}
		});

		this._toolbar.setTitle(title);
		this._toolbar.setColumns(columns);
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
		this._drawChart();

		this._lastMoveX = NaN;
		this._lastMoveEvent = null;

		cancelAnimationFrame(this._rafId);
	}

	/**
	 * @private
	 */
	_onDraw() {
		if (!this._isMyDrawing && this._lastMoveX) {
			this._reset();
		}
	}

	/**
	 * @param {Event} event
	 * @private
	 */
	_onMove(event) {
		event = /** @type {MouseEvent|TouchEvent} */ (event);

		const eventX = getEventX(event, this._canvas);
		const eventY = getEventY(event, this._canvas);

		const canvasRect = this._canvas.getBoundingClientRect();
		const canvasX = eventX - canvasRect.left;
		const canvasY = eventY - canvasRect.top;

		if (canvasX === this._lastMoveX) {
			return;
		}

		const viewTypes = this._chart.getViewTypes();

		const rulerXs = [];
		const toolbarEntries = [];

		this._chart.highlight(canvasX);

		viewTypes.forEach((viewType, index) => {
			const graphs = this._chart.getViewGraphs(index);
			const graphsWithHighlightedPoint = [];

			graphs.forEach((graph) => {
				const highlightedPoint = this._chart.getGraphHighlightedPoint(graph);
				if (highlightedPoint) {
					graphsWithHighlightedPoint.push({
						graph,
						point: highlightedPoint
					});
				}
			});

			if (!graphsWithHighlightedPoint.length) {
				return;
			}

			const isRulerNeeded = viewType === ViewType.LINE || viewType === ViewType.AREA;
			if (isRulerNeeded) {
				graphsWithHighlightedPoint.forEach(({graph, point}) => {
					if (!rulerXs.includes(point.x)) {
						rulerXs.push(point.x);
					}
				});
			}

			toolbarEntries.push({
				viewType,
				graphsWithPoint: graphsWithHighlightedPoint
			});
		});

		this._chart.removeRulers();
		rulerXs.forEach((x) => {
			this._chart.addRuler(x);
		});

		this._rafId = requestAnimationFrame(() => {
			this._drawChart();

			if (toolbarEntries.length) {
				this._showToolbar(this._chart.getXByPixels(canvasX), toolbarEntries, canvasX, canvasY);
			} else {
				this._hideToolbar();
			}
		});

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
