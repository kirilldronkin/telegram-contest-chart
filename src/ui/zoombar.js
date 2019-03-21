import {noop, createDiv} from '../utils.js';

const {max, round} = Math;

export default class Zoombar {
	constructor(container) {
		this._container = container;
		this._updateListener = noop;

		this._setupDOM();
		this._listenDOMEvents();

		// Cache sizes
		this._leftOverlaySize = NaN;
		this._leftGripSize = this._leftGrip.offsetWidth; // Fixed
		this._panSize = NaN;
		this._rightGripSize = this._rightGrip.offsetWidth; // Fixed
		this._rightOverlaySize = NaN;
	}

	setUpdateListener(listener) {
		this._updateListener = listener;
	}

	setRange(start, end) {
		const containerSize = this._container.offsetWidth;

		this._renderLeftOverlaySize(start - this._leftGripSize);
		this._renderRightOverlaySize(containerSize - end - this._rightGripSize);
		this._renderPanSize(end - start);
	}

	getRange() {
		const start = this._leftOverlaySize + this._leftGripSize;
		const end = start + this._panSize;

		return {start, end};
	}

	_setupDOM() {
		this._container.classList.add('zoombar');

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
	}

	_listenDOMEvents() {
		listenHorizontalDragEvent(this._container, this._leftGrip, this._onLeftGripDragged.bind(this));
		listenHorizontalDragEvent(this._container, this._rightGrip, this._onRightGripDragged.bind(this));
		listenHorizontalDragEvent(
			this._container,
			this._pan,
			this._onPanDragged.bind(this),
			this._onPanDragStarted.bind(this),
			this._onPanDragEnded.bind(this)
		);

		this._leftOverlay.addEventListener('click', this._onLeftOverlayClicked.bind(this));
		this._rightOverlay.addEventListener('click', this._onRightOverlayClicked.bind(this));
	}

	_renderPanSize(size) {
		const containerSize = this._container.offsetWidth;
		const gripsSize = this._leftGripSize + this._rightGripSize;
		const draggable = size < containerSize - gripsSize;

		this._panSize = size;
		this._pan.style.width = `${size}px`;
		this._pan.classList.toggle('_draggable', draggable);
	}

	_renderLeftOverlaySize(size) {
		this._leftOverlaySize = size;
		this._leftOverlay.style.width = `${size}px`;
	}

	_renderRightOverlaySize(size) {
		this._rightOverlaySize = size;
		this._rightOverlay.style.width = `${size}px`;
	}

	_onLeftGripDragged(positionDiff) {
		const newPanSize = this._panSize - positionDiff;
		if (newPanSize >= 0) {
			this._renderLeftOverlaySize(this._leftOverlaySize + positionDiff);
			this._renderPanSize(newPanSize);

			this._updateListener();
		}
	}

	_onRightGripDragged(positionDiff) {
		const newPanSize = this._panSize + positionDiff;
		if (newPanSize >= 0) {
			this._renderRightOverlaySize(this._rightOverlaySize - positionDiff);
			this._renderPanSize(newPanSize);

			this._updateListener();
		}
	}

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

	_onPanDragStarted() {
		this._pan.classList.add('_dragging');
	}

	_onPanDragEnded() {
		this._pan.classList.remove('_dragging');
	}

	_onLeftOverlayClicked(event) {
		const leftOverlayBCR = this._leftOverlay.getBoundingClientRect();

		let newPanStart = event.clientX - leftOverlayBCR.left - this._leftGripSize;
		newPanStart -= this._panSize / 2;
		newPanStart = max(newPanStart, 0);

		this._renderLeftOverlaySize(newPanStart);
		this._renderRightOverlaySize(this._rightOverlaySize + leftOverlayBCR.width - newPanStart);

		this._updateListener();
	}

	_onRightOverlayClicked(event) {
		const rightOverlayBCR = this._rightOverlay.getBoundingClientRect();

		let newPanEnd = rightOverlayBCR.right - event.clientX - this._rightGripSize;
		newPanEnd -= this._panSize / 2;
		newPanEnd = max(newPanEnd, 0);

		this._renderRightOverlaySize(newPanEnd);
		this._renderLeftOverlaySize(this._leftOverlaySize + rightOverlayBCR.width - newPanEnd);

		this._updateListener();
	}
}

function getEventXCoordinate(event) {
	return event.targetTouches ? event.targetTouches[0].clientX : event.clientX;
}

function listenHorizontalDragEvent(container, element, onMoved = noop, onStarted  = noop, onEnded = noop) {
	const listener =  (event) => {
		const eventX = getEventXCoordinate(event);

		const containerBCR = container.getBoundingClientRect();
		const elementBCR = element.getBoundingClientRect();

		const mouseOffset = eventX - elementBCR.left;

		let lastPosition = eventX - containerBCR.left;
		const onMove = (event) => {
			const eventX = getEventXCoordinate(event);
			const newPosition = eventX - containerBCR.left;

			if (newPosition > mouseOffset && newPosition + elementBCR.width - mouseOffset < containerBCR.width) {
				const diff = newPosition - lastPosition;
				if (diff) {
					onMoved(round(diff));
				}

				lastPosition = newPosition;
			}
		};

		const onEnd = () => {
			container.removeEventListener('mousemove', onMove);
			container.removeEventListener('touchmove', onMove);
			container.removeEventListener('mouseup', onEnd);
			container.removeEventListener('mouseleave', onEnd);
			container.removeEventListener('touchend', onEnd);

			onEnded();
		};

		container.addEventListener('mousemove', onMove);
		container.addEventListener('touchmove', onMove);
		container.addEventListener('mouseup', onEnd);
		container.addEventListener('mouseleave', onEnd);
		container.addEventListener('touchend', onEnd);

		onStarted();
	};

	element.addEventListener('mousedown', listener);
	element.addEventListener('touchstart', listener);
}
