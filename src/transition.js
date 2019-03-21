import {noop, identity, easeInQuart, easeOutQuart} from './utils.js';

const {min, max} = Math;

const State = {
	PENDING: 'pending',
	ACTIVE: 'active',
	COMPLETE: 'complete'
};

export const Timing = {
	LINEAR: 'linear',
	EASE_IN: 'ease-in',
	EASE_OUT: 'ease-out',
};

export default class Transition {
	constructor(intervals, duration, timing, onProgress = noop, onComplete = noop, onUpdate = noop) {
		this._intervals = intervals;
		this._duration = duration;

		this._timingFunction = {
			[Timing.LINEAR]: identity,
			[Timing.EASE_IN]: easeInQuart,
			[Timing.EASE_OUT]: easeOutQuart
		}[timing];

		this._onProgress = onProgress;
		this._onComplete = onComplete;
		this._onUpdate = onUpdate;

		this._state = State.PENDING;
		this._rafId = NaN;
	}

	isPending() {
		return this._state === State.PENDING;
	}

	isActive() {
		return this._state === State.ACTIVE;
	}

	getIntervals() {
		return this._intervals;
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

			const passed = min(time - start, this._duration);

			this._onProgress(...this._intervals.map((interval) => {
				const range = interval.to - interval.from;

				const current = interval.from + ((range) * (this._timingFunction(passed / this._duration)));

				if (range > 0) {
					return min(current, interval.to);
				} else {
					return max(current, interval.to);
				}
			}));

			if (passed < this._duration) {
				this._rafId = requestAnimationFrame(step);
			} else {
				this._state = State.COMPLETE;
				this._onComplete();
			}

			this._onUpdate();
		};

		this._rafId = requestAnimationFrame(step);
		this._state = State.ACTIVE;
	}

	stop() {
		if (!this.isActive()) {
			this._throwInvalidState();
		}

		cancelAnimationFrame(this._rafId);

		this._state = State.PENDING;
	}

	_throwInvalidState() {
		throw new Error(`Invalid state ${this._state}`);
	}
}
