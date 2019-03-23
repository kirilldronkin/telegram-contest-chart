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
 * @param {string=} className
 * @param {string=} text
 * @returns {HTMLDivElement}
 */
function createDiv(className, text) {
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
 * @param {function(number, number)} comparator
 * @return {number}
 */
function findNumber(array, extractor, comparator) {
	return array.reduce((last, item) => {
		const value = extractor(item);

		if (isNaN(value) || isNaN(last)) {
			return value;
		}

		return comparator(last, value);
	}, NaN);
}

/**
 * @param {Array<*>} array
 * @param {function(*): number} extractor
 * @return {number}
 */
function findMax(array, extractor) {
	return findNumber(array, extractor, max);
}

/**
 * @param {Array<*>} array
 * @param {function(*): number} extractor
 * @return {number}
 */
function findMin(array, extractor) {
	return findNumber(array, extractor, min);
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
 * @param {number} spacing
 * @return {string}
 */
function formatDate(date, spacing) {
	const msInSecond = 1000;
	const msInMinute = msInSecond * 60;
	const msInHour = msInMinute * 60;
	const msInDay = msInHour * 24;
	const msInMonth = msInDay * 30;
	const msInYear = msInMonth * 12;

	if (spacing / msInYear >= 1) {
		return `${date.getFullYear()}`;
	} else if (spacing / msInMonth >= 1) {
		return `${date.getFullYear()} ${getShortMonthName(date.getMonth())}`;
	} else if (spacing / msInDay >= 1) {
		return `${getShortMonthName(date.getMonth())} ${date.getDate()}`;
	} else if (spacing / msInHour >= 1) {
		return `${getShortMonthName(date.getMonth())} ${date.getDate()} ${to12Hours(date)}`;
	} else if (spacing / msInMinute >= 1) {
		return `${to12Hours(date, {withMinutes: true})}`
	} else if (spacing / msInSecond >= 1) {
		return `${date.getMinutes()}:${String(date.getSeconds()).padStart(2, '0')}`;
	}

	return date.toString();
}

export {
	noop,
	identity,
	createDiv,
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
	formatDate
};
