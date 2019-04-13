import Linear from './linear.js';
import Transition, {Timing} from '../transition.js';
import {niceNumber, clamp} from '../utils.js';

const {ceil, floor} = Math;

export default class YLinear extends Linear {
	/**
	 * @param {{
	 *     nice: (boolean|undefined)
	 * }=} opt
	 */
	constructor({nice = false} = {}) {
		super();

		/**
		 * @type {boolean}
		 * @private
		 */
		this._nice = nice;
	}

	/**
	 * @override
	 */
	getValueByPixels(pixels, {fit = false} = {}) {
		let value = (this._dimension - this._padding[1] - pixels) / this._pixelsPerValue;

		if (fit) {
			return clamp(this._fitStart + value, this._fitStart, this._fitEnd);
		}

		return clamp(value, this._start, this._end);
	}

	/**
	 * @override
	 */
	getPixelsByValue(value, {fit = false} = {}) {
		if (fit) {
			value -= this._fitStart;
		}

		return this._dimension - this._padding[1] - (this._pixelsPerValue * value);
	}

	/**
	 * @override
	 */
	fit() {
		const start = isNaN(this._rangeStart) ? this._start : this._rangeStart;
		const end = isNaN(this._rangeEnd) ? this._end : this._rangeEnd;

		let spacing = (end - start) / this._ticksCount;
		if (!spacing) {
			this._fitStart = NaN;
			this._fitEnd = NaN;
			this._ticksSpacing = NaN;
			this._pixelsPerValue = NaN;

			return;
		}

		if (this._nice) {
			spacing = niceNumber(spacing);

			const niceTicksCount = ceil(end / spacing) - floor(start / spacing);
			if (niceTicksCount > this._ticksCount) {
				spacing = niceNumber(niceTicksCount * spacing / this._ticksCount);
			}
		}

		const newFitStart = this._nice ? (floor(start / spacing) * spacing) : start;
		const newFitEnd = this._nice ? (ceil(end / spacing) * spacing) : end;

		if (isNaN(this._fitStart) || isNaN(this._fitEnd)) {
			this._fitStart = newFitStart;
			this._fitEnd = newFitEnd;
			this._ticksSpacing = spacing;
			this._pixelsPerValue = this._calculatePixelsPerValue();

			return;
		}

		let oldFitStart;
		let oldFitEnd;

		if (this._transition) {
			const intervals = this._transition.getIntervals();

			oldFitStart = intervals[0].to;
			oldFitEnd = intervals[1].to;
		} else {
			oldFitStart = this._fitStart;
			oldFitEnd = this._fitEnd;
		}

		if (newFitStart === oldFitStart && newFitEnd === oldFitEnd) {
			return;
		}

		this._ticksSpacing = spacing;

		let currentFitStart;
		let currentFitEnd;

		if (this._transition) {
			const values = this._transition.getValues();

			currentFitStart = values[0];
			currentFitEnd = values[1];
		} else {
			currentFitStart = oldFitStart;
			currentFitEnd = oldFitEnd;
		}

		const fitStartInterval = {from: currentFitStart, to: newFitStart};
		const fitEndInterval = {from: currentFitEnd, to: newFitEnd};

		if (this._transition) {
			this._transition.stop();
		}

		this._transition = new Transition({
			timing: Timing.LINEAR,
			duration: this._transitionDuration,
			intervals: [fitStartInterval, fitEndInterval],

			onStart: () => {
				this._onTransitionStart(newFitStart, newFitEnd);
			},

			onProgress: ([fitStart, fitEnd]) => {
				this._fitStart = fitStart;
				this._fitEnd = fitEnd;
				this._pixelsPerValue = this._calculatePixelsPerValue();

				this._onTransitionProgress(this._transition.getProgress());
			},

			onUpdate: () => {
				this._onTransitionUpdate();
			},

			onComplete: () => {
				this._transition = null;

				this._onTransitionComplete();
			}
		});
	}
}
