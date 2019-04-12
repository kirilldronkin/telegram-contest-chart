import Linear from './linear.js';
import {clamp} from '../utils.js';

export default class XLinear extends Linear {
	/**
	 * @override
	 */
	getValueByPixels(pixels, {fit = false} = {}) {
		let value = (pixels - this._padding[0]) / this._pixelsPerValue;

		if (fit) {
			return clamp(this._fitStart + value, this._fitStart, this._fitEnd);
		}

		return clamp(value, this._start, this._end);
	}

	/**
	 * @override
	 */
	getPixelsByValue(value, {fit = false, padding = true} = {}) {
		if (fit) {
			value -= this._fitStart;
		}

		let pixels = this._pixelsPerValue * value;
		if (padding) {
			pixels += this._padding[0];
		}

		return pixels;
	}

	/**
	 * @override
	 */
	fit() {
		const start = isNaN(this._rangeStart) ? this._start : this._rangeStart;
		const end = isNaN(this._rangeEnd) ? this._end : this._rangeEnd;

		let spacing = this._ticksSpacing;
		if (!spacing) {
			spacing = (end - start) / this._ticksCount;
		} else {
			const ticksCount = (end - start) / spacing;

			if (!ticksCount) {
				spacing = NaN;
			} else if (ticksCount > this._ticksCount) {
				spacing *= 2;
			} else if (ticksCount < this._ticksCount - 2) {
				spacing /= 2;
			}
		}

		if (!spacing) {
			this._fitStart = NaN;
			this._fitEnd = NaN;
			this._ticksSpacing = NaN;
			this._pixelsPerValue = NaN;

			return;
		}

		if (spacing !== this._ticksSpacing) {
			this._ticksSpacing = spacing;
		}

		this._fitStart = start;
		this._fitEnd = end;
		this._pixelsPerValue = this._calculatePixelsPerValue();
	}
}
