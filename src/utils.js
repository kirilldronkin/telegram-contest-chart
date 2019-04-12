const {min, max, floor, pow, log10} = Math;

function noop() {}

/**
 * @template TYPE
 * @param {TYPE} value
 * @return {TYPE}
 */
function identity(value) {
	return value;
}

/**
 * @template TYPE
 * @param {Array<TYPE>} values
 * @return {Array<TYPE>}
 */
function unique(values) {
	return Array.from(new Set(values));
}

/**
 * @param {Array} array
 * @param {...*} items
 */
function pull(array, ...items) {
	items.forEach((item) => {
		array.splice(array.indexOf(item), 1);
	});
}

/**
 * @param {...Object} objects
 * @return {Object}
 */
function merge(...objects) {
	return Object.assign({}, ...objects);
}

/**
 * @template RESULT_TYPE
 * @param {function(...?): RESULT_TYPE} func
 * @param {number} time
 * @return {function(...?): RESULT_TYPE}
 */
function debounce(func, time) {
	let timer = null;

	function debounced(...args) {
		function complete() {
			timer = null;

			return func(...args);
		}

		if (timer) {
			clearTimeout(timer);
		}

		timer = setTimeout(complete, time);
	}

	return debounced;
}

/**
 * @template RESULT_TYPE
 * @param {function(...?): RESULT_TYPE} func
 * @param {number} time
 * @return {function(...?): RESULT_TYPE}
 */
function throttle(func, time) {
	let lastTimestamp = null;

	return function(...args) {
		const now = Date.now();

		if (!lastTimestamp || now - lastTimestamp >= time) {
			lastTimestamp = now;
			func(...args);
		}
	};
}

/**
 * @param {MouseEvent|TouchEvent} event
 * @param {HTMLElement} target
 * @return {number}
 */
function getEventX(event, target) {
	if (!event.touches) {
		return event.clientX;
	}

	const touch = Array.from(event.touches).find((touch) => touch.target === target);
	if (touch) {
		return touch.clientX;
	}

	return NaN;
}

/**
 * @param {MouseEvent|TouchEvent} event
 * @param {HTMLElement} target
 * @return {number}
 */
function getEventY(event, target) {
	if (!event.touches) {
		return event.clientY;
	}

	const touch = Array.from(event.touches).find((touch) => touch.target === target);
	if (touch) {
		return touch.clientY;
	}

	return NaN;
}

/**
 * @param {string=} className
 * @param {string=} text
 * @returns {HTMLDivElement}
 */
function createDivElement(className, text) {
	const div = /** @type {HTMLDivElement} */ (document.createElement('div'));

	if (className) {
		div.classList.add(className);
	}

	if (text) {
		div.textContent = text;
	}

	return div;
}

/**
 * @param {string=} className
 * @returns {HTMLCanvasElement}
 */
function createCanvasElement(className) {
	const canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));

	if (className) {
		canvas.classList.add(className);
	}

	return canvas;
}

/**
 * @param {string} hex
 * @param {number} alpha
 * @return {string}
 */
function hexToRGB(hex, alpha) {
	if (alpha === 1) {
		return hex;
	}

	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);

	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * @param {number} value
 * @param {number} minBoundary
 * @param {number} maxBoundary
 * @return {number}
 */
function clamp(value, minBoundary, maxBoundary) {
	return max(min(value, maxBoundary), minBoundary);
}

/**
 * @param {Array<*>} array
 * @param {function(*): number} extractor
 * @param {{
 *     sorted: (boolean|undefined)
 * }=} opt
 * @return {number}
 */
function findMax(array, extractor, {sorted = false} = {}) {
	if (sorted && array.length) {
		return extractor(array[array.length - 1]);
	}

	let found = NaN;

	for (let i = 0; i < array.length; i++) {
		const value = extractor(array[i]);

		if (isNaN(found) || value > found) {
			found = value;
		}
	}

	return found;
}

/**
 * @param {Array<*>} array
 * @param {function(*): number} extractor
 * @param {{
 *     sorted: (boolean|undefined)
 * }=} opt
 * @return {number}
 */
function findMin(array, extractor, {sorted = false} = {}) {
	if (sorted && array.length) {
		return extractor(array[0]);
	}

	let found = NaN;

	for (let i = 0; i < array.length; i++) {
		const value = extractor(array[i]);

		if (isNaN(found) || value < found) {
			found = value;
		}
	}

	return found;
}

/**
 * @see http://www.robertpenner.com/easing/
 * @param {number} t
 * @return {number}
 */
function easeInQuart(t) {
	return t * t * t * t;
}

/**
 * @see http://www.robertpenner.com/easing/
 * @param {number} t
 * @return {number}
 */
function easeOutQuart(t) {
	return -((t = t - 1) * t * t * t - 1);
}

/**
 * @see https://stackoverflow.com/questions/8506881/nice-label-algorithm-for-charts-with-minimum-ticks
 * @param {number} value
 * @return {number}
 */
function niceNumber(value) {
	const exponent = floor(log10(value));
	const fraction = value / pow(10, exponent);

	let niceFraction;
	if (fraction < 1) {
		niceFraction = 1;
	} else if (fraction < 2) {
		niceFraction = 2;
	} else if (fraction < 5) {
		niceFraction = 5;
	} else {
		niceFraction = 10;
	}

	return niceFraction * pow(10, exponent);
}

/**
 * @param {number} value
 * @return {string}
 */
function compactNumber(value) {
	const suffixes = ['', 'K', 'M', 'B', 'T'];

	let suffixIndex = 0;
	while (value >= 1000) {
		value /= 1000;
		suffixIndex++;
	}

	return Number(value.toFixed(1)) + suffixes[suffixIndex];
}

/**
 * @param {number} index
 * @return {string}
 */
function getShortMonthName(index) {
	const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	return names[index] || 'Unknown';
}

/**
 * @param {Date} date
 * @param {{
 *     withMinutes: (boolean|undefined)
 * }=} opt
 * @return {string}
 */
function to12Hours(date, {withMinutes = false} = {}) {
	const hours = date.getHours();

	const convertedHours = hours % 12 || 12;
	const paddedMinutes = String(date.getMinutes()).padStart(2, '0');
	const period = hours < 12 ? 'A' : 'P';

	return `${convertedHours}${withMinutes ? `:${paddedMinutes}` : ''} ${period}M`;
}

/**
 * Reinvent the wheel cuz Date#toLocaleDateString() is extremely slow
 * @param {Date} date
 * @param {DateUnit=} unit
 * @return {string}
 */
function formatDate(date, unit) {
	if (unit === DateUnit.YEAR) {
		return `${date.getFullYear()}`;
	} else if (unit === DateUnit.MONTH) {
		return `${date.getFullYear()} ${getShortMonthName(date.getMonth())}`;
	} else if (unit === DateUnit.DAY) {
		return `${getShortMonthName(date.getMonth())} ${date.getDate()}`;
	} else if (unit === DateUnit.HOUR) {
		return `${date.getDate()} ${to12Hours(date)}`;
	} else if (unit === DateUnit.MINUTE) {
		return `${to12Hours(date, {withMinutes: true})}`
	} else if (unit === DateUnit.SECOND) {
		return `${date.getMinutes()}:${String(date.getSeconds()).padStart(2, '0')}`;
	} else if (unit === DateUnit.MILLISECOND) {
		return `${date.getSeconds()}, ${date.getMilliseconds()}`;
	}

	return date.toString();
}

/**
 * @enum {string}
 */
const DateUnit = {
	YEAR: 'year',
	MONTH: 'month',
	DAY: 'day',
	HOUR: 'hour',
	MINUTE: 'minute',
	SECOND: 'second',
	MILLISECOND: 'millisecond',
};

class NotImplementedError extends Error {
	constructor() {
		super('Not implemented');
	}
}

export {
	noop,
	identity,
	unique,
	pull,
	merge,
	debounce,
	throttle,
	getEventX,
	getEventY,
	createDivElement,
	createCanvasElement,
	hexToRGB,
	clamp,
	findMax,
	findMin,
	easeInQuart,
	easeOutQuart,
	niceNumber,
	compactNumber,
	getShortMonthName,
	to12Hours,
	formatDate,
	DateUnit,
	NotImplementedError
};
