import {noop, createDiv} from '../utils.js';

const {max, round} = Math;

/**
 * @const {number}
 */
const CLICKS_INACTIVITY_TIME_AFTER_DRAG = 100;

export default class Zoombar {
	/**
	 * @param {HTMLElement} container
	 */
	constructor(container) {
		/**
		 * @type {HTMLElement}
		 * @private
		 */
		this._container = container;

		/**
		 * @type {number}
		 * @private
		 */
		this._containerSize = NaN;

		/**
		 * @type {function()}
		 * @private
		 */
		this._updateListener = noop;

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._leftOverlay;

		/**
		 * @type {number}
		 * @private
		 */
		this._leftOverlaySize = NaN;

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._leftGrip;

		/**
		 * @type {number}
		 * @private
		 */
		this._leftGripSize = NaN;

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._pan;

		/**
		 * @type {number}
		 * @private
		 */
		this._panSize = NaN;

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._rightGrip;

		/**
		 * @type {number}
		 * @private
		 */
		this._rightGripSize = NaN;

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._rightOverlay;

		/**
		 * @type {number}
		 * @private
		 */
		this._rightOverlaySize = NaN;

		this._setupDOM();
		this._listenDOMEvents();
	}

	resize() {
		this._containerSize = this._container.offsetWidth;
	}

	/**
	 * @param {function()} listener
	 */
	setUpdateListener(listener) {
		this._updateListener = listener;
	}

	/**
	 * @param {number} start
	 * @param {number} end
	 */
	setRange(start, end) {
		this._renderLeftOverlaySize(start - this._leftGripSize);
		this._renderRightOverlaySize(this._containerSize - end - this._rightGripSize);
		this._renderPanSize(end - start);
	}

	/**
	 * @return {{start: number, end: number}}
	 */
	getRange() {
		const start = this._leftOverlaySize + this._leftGripSize;
		const end = start + this._panSize;

		return {start, end};
	}

	/**
	 * @private
	 */
	_setupDOM() {
		this._container.classList.add('zoombar');
		this._containerSize = this._container.offsetWidth;

		this._leftGrip = createDiv('zoombar__grip');
		this._leftOverlay = createDiv('zoombar__overlay');
		this._pan = createDiv('zoombar__pan');
		this._rightGrip = createDiv('zoombar__grip');
		this._rightOverlay = createDiv('zoombar__overlay');

		this._container.appendChild(this._leftOverlay);
		this._container.appendChild(this._leftGrip);
		this._container.appendChild(this._pan);
		this._container.appendChild(this._rightGrip);
		this._container.appendChild(this._rightOverlay);

		// Fixed sizes
		this._leftGripSize = this._leftGrip.offsetWidth;
		this._rightGripSize = this._rightGrip.offsetWidth;
	}

	/**
	 * @private
	 */
	_listenDOMEvents() {
		listenHorizontalDrag(this._container, this._leftGrip, this._onLeftGripDragged.bind(this));
		listenHorizontalDrag(this._container, this._rightGrip, this._onRightGripDragged.bind(this));
		listenHorizontalDrag(
			this._container,
			this._pan,
			this._onPanDragged.bind(this),
			this._onPanDragStarted.bind(this),
			this._onPanDragEnded.bind(this)
		);

		this._leftOverlay.addEventListener('click', this._onLeftOverlayClicked.bind(this));
		this._rightOverlay.addEventListener('click', this._onRightOverlayClicked.bind(this));
	}

	/**
	 * @param {number} size
	 * @private
	 */
	_renderPanSize(size) {
		const gripsSize = this._leftGripSize + this._rightGripSize;
		const draggable = size < this._containerSize - gripsSize;

		this._panSize = size;
		this._pan.style.width = `${size}px`;
		this._pan.classList.toggle('_draggable', draggable);
	}

	/**
	 * @param {number} size
	 * @private
	 */
	_renderLeftOverlaySize(size) {
		this._leftOverlaySize = size;
		this._leftOverlay.style.width = `${size}px`;
	}

	/**
	 * @param {number} size
	 * @private
	 */
	_renderRightOverlaySize(size) {
		this._rightOverlaySize = size;
		this._rightOverlay.style.width = `${size}px`;
	}

	/**
	 * @param {number} positionDiff
	 * @private
	 */
	_onLeftGripDragged(positionDiff) {
		const newPanSize = this._panSize - positionDiff;
		if (newPanSize >= 0) {
			this._renderLeftOverlaySize(this._leftOverlaySize + positionDiff);
			this._renderPanSize(newPanSize);

			this._updateListener();
		}
	}

	/**
	 * @param {number} positionDiff
	 * @private
	 */
	_onRightGripDragged(positionDiff) {
		const newPanSize = this._panSize + positionDiff;
		if (newPanSize >= 0) {
			this._renderRightOverlaySize(this._rightOverlaySize - positionDiff);
			this._renderPanSize(newPanSize);

			this._updateListener();
		}
	}

	/**
	 * @param {number} positionDiff
	 * @private
	 */
	_onPanDragged(positionDiff) {
		let newLeftOverlaySize = this._leftOverlaySize + positionDiff;
		let newRightOverlaySize = this._rightOverlaySize - positionDiff;

		if (newLeftOverlaySize < 0) {
			newRightOverlaySize += newLeftOverlaySize;
			newLeftOverlaySize = 0;
		} else if (newRightOverlaySize < 0) {
			newLeftOverlaySize += newRightOverlaySize;
			newRightOverlaySize = 0;
		}

		this._renderLeftOverlaySize(newLeftOverlaySize);
		this._renderRightOverlaySize(newRightOverlaySize);

		this._updateListener();
	}

	/**
	 * @private
	 */
	_onPanDragStarted() {
		this._pan.classList.add('_dragging');
	}

	/**
	 * @private
	 */
	_onPanDragEnded() {
		this._pan.classList.remove('_dragging');
	}

	/**
	 * @param {Event} event
	 * @private
	 */
	_onLeftOverlayClicked(event) {
		event = /** @type {MouseEvent} */ (event);

		const leftOverlayRect = this._leftOverlay.getBoundingClientRect();

		let newPanStart = event.clientX - leftOverlayRect.left - this._leftGripSize;
		newPanStart -= this._panSize / 2;
		newPanStart = max(newPanStart, 0);

		this._renderLeftOverlaySize(newPanStart);
		this._renderRightOverlaySize(this._rightOverlaySize + leftOverlayRect.width - newPanStart);

		this._updateListener();
	}

	/**
	 * @param {Event} event
	 * @private
	 */
	_onRightOverlayClicked(event) {
		event = /** @type {MouseEvent} */ (event);

		const rightOverlayRect = this._rightOverlay.getBoundingClientRect();

		let newPanEnd = rightOverlayRect.right - event.clientX - this._rightGripSize;
		newPanEnd -= this._panSize / 2;
		newPanEnd = max(newPanEnd, 0);

		this._renderRightOverlaySize(newPanEnd);
		this._renderLeftOverlaySize(this._leftOverlaySize + rightOverlayRect.width - newPanEnd);

		this._updateListener();
	}
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
 * @param {HTMLElement} container
 * @param {HTMLElement} element
 * @param {function(number)=} onMoved
 * @param {function()} onStarted
 * @param {function()} onEnded
 */
function listenHorizontalDrag(container, element, onMoved = noop, onStarted  = noop, onEnded = noop) {
	let containerRect;
	let elementRect;
	let offset;
	let lastPosition;
	let clicksInactivityTimeoutId;

	/**
	 * @param {Event} event
	 */
	const onStart = (event) => {
		event = /** @type {MouseEvent|TouchEvent} */ (event);

		const eventX = getEventX(event, element);

		containerRect = container.getBoundingClientRect();
		elementRect = element.getBoundingClientRect();
		offset = eventX - elementRect.left;
		lastPosition = eventX - containerRect.left;

		container.addEventListener('mousemove', onMove);
		container.addEventListener('touchmove', onMove);
		container.addEventListener('mouseup', onEnd);
		container.addEventListener('mouseleave', onEnd);
		container.addEventListener('touchend', onEnd);

		if (clicksInactivityTimeoutId) {
			clearTimeout(clicksInactivityTimeoutId);
			clicksInactivityTimeoutId = undefined;
		}

		// Capture clicks and stop them propagation while dragging
		container.addEventListener('click', onClick, true);

		onStarted();
	};

	/**
	 * @param {Event} event
	 */
	const onMove = (event) => {
		event = /** @type {MouseEvent|TouchEvent} */ (event);

		const eventX = getEventX(event, element);
		const newPosition = eventX - containerRect.left;

		if (newPosition >= offset && newPosition + elementRect.width - offset <= containerRect.width) {
			const diff = newPosition - lastPosition;
			if (diff) {
				onMoved(round(diff));
			}

			lastPosition = newPosition;
		}
	};

	/**
	 * @param {Event} event
	 */
	const onClick = (event) => {
		event.stopPropagation();
	};

	const onEnd = () => {
		container.removeEventListener('mousemove', onMove);
		container.removeEventListener('touchmove', onMove);
		container.removeEventListener('mouseup', onEnd);
		container.removeEventListener('mouseleave', onEnd);
		container.removeEventListener('touchend', onEnd);

		clicksInactivityTimeoutId = setTimeout(() => {
			container.removeEventListener('click', onClick, true);
		}, CLICKS_INACTIVITY_TIME_AFTER_DRAG);

		containerRect = undefined;
		elementRect = undefined;
		offset = undefined;
		lastPosition = undefined;

		onEnded();
	};

	element.addEventListener('mousedown', onStart);
	element.addEventListener('touchstart', onStart);
}
