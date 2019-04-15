import {noop, identity, easeInQuart, easeOutQuart} from './utils.js';

const {min, max} = Math;

/**
 * @typedef {{
 *     from: number,
 *     to: number
 * }}
 */
let Interval;

/**
 * @enum {string}
 */
const State = {
	PENDING: 'pending',
	ACTIVE: 'active',
	COMPLETE: 'complete'
};

/**
 * @enum {string}
 */
export const Timing = {
	LINEAR: 'linear',
	EASE_IN: 'ease-in',
	EASE_OUT: 'ease-out',
};

export default class Transition {
	/**
	 * @param {{
	 *     intervals: Array<Interval>,
	 *     duration: number,
	 *     timing: Timing,
	 *     onStart: (function()|undefined),
	 *     onProgress: (function(Array<number>)|undefined),
	 *     onComplete: (function()|undefined),
	 *     onUpdate: (function()|undefined),
	 *     onCancel: (function()|undefined)
	 * }} opt
	 */
	constructor({
    intervals,
    duration,
    timing,
    onStart = noop,
    onProgress = noop,
    onComplete = noop,
    onUpdate = noop,
    onCancel = noop
	}) {
		/**
		 * @type {Array<Interval>}
		 * @private
		 */
		this._intervals = intervals;

		/**
		 * @type {number}
		 * @private
		 */
		this._duration = duration;

		/**
		 * @type {function(number): number}
		 * @private
		 */
		this._timingFunction = {
			[Timing.LINEAR]: identity,
			[Timing.EASE_IN]: easeInQuart,
			[Timing.EASE_OUT]: easeOutQuart
		}[timing];

		/**
		 * @type {function()}
		 * @private
		 */
		this._onStart = onStart;

		/**
		 * @type {function(Array<number>)}
		 * @private
		 */
		this._onProgress = onProgress;

		/**
		 * @type {function()}
		 * @private
		 */
		this._onComplete = onComplete;

		/**
		 * @type {function()}
		 * @private
		 */
		this._onUpdate = onUpdate;

		/**
		 * @type {function()}
		 * @private
		 */
		this._onCancel = onCancel;

		/**
		 * @type {number}
		 * @private
		 */
		this._rafId = NaN;

		/**
		 * @type {Array<number>}
		 * @private
		 */
		this._values = [];

		/**
		 * @type {number}
		 * @private
		 */
		this._progress = 0;

		/**
		 * @type {State}
		 * @private
		 */
		this._state = State.PENDING;
	}

	/**
	 * @return {boolean}
	 */
	isPending() {
		return this._state === State.PENDING;
	}

	/**
	 * @return {boolean}
	 */
	isActive() {
		return this._state === State.ACTIVE;
	}

	/**
	 * @return {Array<Interval>}
	 */
	getIntervals() {
		return this._intervals;
	}

	/**
	 * @return {Array<number>}
	 */
	getValues() {
		return this._values;
	}

	/**
	 * @return {number}
	 */
	getProgress() {
		return this._progress;
	}

	start() {
		if (this.isActive()) {
			this._throwInvalidState();
		}

		let start;

		const step = (time) => {
			if (!start) {
				start = time;
			}

			this._progress = this._timingFunction(min(time - start, this._duration) / this._duration);

			this._values = this._intervals.map((interval) => {
				const range = interval.to - interval.from;
				const value = interval.from + ((range) * (this._progress));

				if (range > 0) {
					return min(value, interval.to);
				} else {
					return max(value, interval.to);
				}
			});

			this._onProgress(this._values);

			if (this._progress < 1) {
				this._rafId = requestAnimationFrame(step);
			} else {
				this._state = State.COMPLETE;
				this._onComplete();
			}

			this._onUpdate();
		};

		this._rafId = requestAnimationFrame(step);
		this._values = this._intervals.map((interval) => interval.from);

		this._state = State.ACTIVE;
		this._onStart();
	}

	stop() {
		if (!this.isActive()) {
			this._throwInvalidState();
		}

		cancelAnimationFrame(this._rafId);

		this._values = [];
		this._progress = 0;

		this._state = State.PENDING;
		this._onCancel();
	}

	/**
	 * @private
	 */
	_throwInvalidState() {
		throw new Error(`Invalid state ${this._state}`);
	}
}
