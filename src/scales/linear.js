import IScale from '../interfaces/i-scale.js';
import Transition from '../transition.js';
import {noop, NotImplementedError} from '../utils.js';

/**
 * @implements {IScale}
 */
export default class Linear {
	constructor() {
		/**
		 * @type {number}
		 * @protected
		 */
		this._dimension = 0;

		/**
		 * @type {Array<number>}
		 * @protected
		 */
		this._padding = [0, 0];

		/**
		 * @type {number}
		 * @protected
		 */
		this._ticksCount = 0;

		/**
		 * @type {number}
		 * @protected
		 */
		this._ticksSpacing = NaN;

		/**
		 * @type {number}
		 * @protected
		 */
		this._pixelsPerValue = NaN;

		/**
		 * @type {number}
		 * @protected
		 */
		this._start = NaN;

		/**
		 * @type {number}
		 * @protected
		 */
		this._end = NaN;

		/**
		 * @type {number}
		 * @protected
		 */
		this._rangeStart = NaN;

		/**
		 * @type {number}
		 * @protected
		 */
		this._rangeEnd = NaN;

		/**
		 * @type {number}
		 * @protected
		 */
		this._fitStart = NaN;

		/**
		 * @type {number}
		 * @protected
		 */
		this._fitEnd = NaN;

		/**
		 * @type {?Transition}
		 * @protected
		 */
		this._transition = null;

		/**
		 * @type {number}
		 * @protected
		 */
		this._transitionDuration = 0;

		/**
		 * @type {function(number, number)}
		 * @protected
		 */
		this._onTransitionStart = noop;

		/**
		 * @type {function(number)}
		 * @protected
		 */
		this._onTransitionProgress = noop;

		/**
		 * @type {function()}
		 * @protected
		 */
		this._onTransitionUpdate = noop;

		/**
		 * @type {function()}
		 * @protected
		 */
		this._onTransitionComplete = noop;
	}

	/**
	 * @override
	 */
	setDimension(dimension) {
		this._dimension = dimension;
		this._pixelsPerValue = this._calculatePixelsPerValue();
	}

	/**
	 * @override
	 */
	getDimension() {
		return this._dimension;
	}

	/**
	 * @override
	 */
	setPadding(padding) {
		this._padding = padding;
	}

	/**
	 * @override
	 */
	getPadding() {
		return this._padding;
	}

	/**
	 * @override
	 */
	setTicksCount(value) {
		this._ticksCount = value;
		this._ticksSpacing = NaN;

		this._fitStart = NaN;
		this._fitEnd = NaN;
	}

	/**
	 * @override
	 */
	getTicksCount() {
		return this._ticksCount;
	}

	/**
	 * @override
	 */
	setStart(start) {
		this._start = start;
	}

	/**
	 * @override
	 */
	getStart() {
		return this._start;
	}

	/**
	 * @override
	 */
	setEnd(end) {
		this._end = end;
	}

	/**
	 * @override
	 */
	getEnd() {
		return this._end;
	}

	/**
	 * @override
	 */
	setRangeStart(start) {
		this._rangeStart = start;
	}

	/**
	 * @override
	 */
	getRangeStart() {
		return this._rangeStart;
	}

	/**
	 * @override
	 */
	setRangeEnd(end) {
		this._rangeEnd = end;
	}

	/**
	 * @override
	 */
	getRangeEnd() {
		return this._rangeEnd;
	}

	/**
	 * @override
	 */
	getFitStart() {
		return this._fitStart;
	}

	/**
	 * @override
	 */
	getFitEnd() {
		return this._fitEnd;
	}

	/**
	 * @override
	 */
	getTicksSpacing() {
		return this._ticksSpacing;
	}

	/**
	 * @override
	 */
	getPixelsPerValue() {
		return this._pixelsPerValue;
	}

	/**
	 * @override
	 */
	getValueByPixels(pixels, {fit = false} = {}) {
		throw new NotImplementedError();
	}

	/**
	 * @override
	 */
	getPixelsByValue(value, {fit = false} = {}) {
		throw new NotImplementedError();
	}

	/**
	 * @override
	 */
	setTransitionDuration(duration) {
		this._transitionDuration = duration;
	}

	/**
	 * @override
	 */
	setTransitionListeners({onStart, onProgress, onUpdate, onComplete} = {}) {
		if (onStart) {
			this._onTransitionStart = onStart;
		}

		if (onProgress) {
			this._onTransitionProgress = onProgress;
		}

		if (onUpdate) {
			this._onTransitionUpdate = onUpdate;
		}

		if (onComplete) {
			this._onTransitionComplete = onComplete;
		}
	}

	/**
	 * @override
	 */
	startTransition() {
		if (this._transition && this._transition.isPending()) {
			this._transition.start();
		}
	}

	/**
	 * @override
	 */
	stopTransition() {
		if (this._transition) {
			this._transition.stop();
		}
	}

	/**
	 * @override
	 */
	isEmpty() {
		return isNaN(this._start) || isNaN(this._end);
	}

	/**
	 * @override
	 */
	isRangeGiven() {
		return !isNaN(this._rangeStart) && !isNaN(this._rangeEnd);
	}

	/**
	 * @override
	 */
	isRangeEmpty() {
		return this._rangeStart === this._rangeEnd;
	}

	/**
	 * @override
	 */
	fit() {
		throw new NotImplementedError();
	}

	/**
	 * @override
	 */
	clear() {
		this._start = NaN;
		this._end = NaN;

		this._rangeStart = NaN;
		this._rangeEnd = NaN;

		this._fitStart = NaN;
		this._fitEnd = NaN;

		this._ticksSpacing = NaN;
		this._pixelsPerValue = NaN;
	}

	/**
	 * @return {number}
	 * @protected
	 */
	_calculatePixelsPerValue() {
		return (this._dimension - this._padding[0] - this._padding[1]) / (this._fitEnd - this._fitStart);
	}
}
