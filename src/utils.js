const {min, max, floor, pow, log10} = Math;

function noop() {}

function identity(value) {
	return value;
}

function createDiv(className, text) {
	const div = document.createElement('div');

	if (className) {
		div.classList.add(className);
	}

	if (text) {
		div.textContent = text;
	}

	return div;
}

function hexToRGB(hex, alpha) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);

	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clamp(value, minBoundary, maxBoundary) {
	return max(min(value, maxBoundary), minBoundary);
}

function findNumber(array, extractor, comparator) {
	return array.reduce((last, item) => {
		const value = extractor(item);

		if (isNaN(value) || isNaN(last)) {
			return value;
		}

		return comparator(last, value);
	}, NaN);
}

function findMax(array, extractor) {
	return findNumber(array, extractor, max);
}

function findMin(array, extractor) {
	return findNumber(array, extractor, min);
}

// See http://www.robertpenner.com/easing/
function easeInQuart(t) {
	return t * t * t * t;
}

// See http://www.robertpenner.com/easing/
function easeOutQuart(t) {
	return -((t = t - 1) * t * t * t - 1);
}

// See https://stackoverflow.com/questions/8506881/nice-label-algorithm-for-charts-with-minimum-ticks
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

function compactNumber(value) {
	const suffixes = ['', 'K', 'M', 'B', 'T'];

	let suffixIndex = 0;
	while (value >= 1000) {
		value /= 1000;
		suffixIndex++;
	}

	return Number(value.toFixed(1)) + suffixes[suffixIndex];
}

function getShortMonthName(index) {
	const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	return names[index] || 'Unknown';
}

function to12Hours(date, {withMinutes = false} = {}) {
	const hours = date.getHours();

	const convertedHours = hours % 12 || 12;
	const paddedMinutes = String(date.getMinutes()).padStart(2, '0');
	const period = hours < 12 ? 'A' : 'P';

	return `${convertedHours}${withMinutes ? `:${paddedMinutes}` : ''} ${period}M`;
}

// Reinvent the wheel cuz Date#toLocaleDateString() is extremely slow
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
