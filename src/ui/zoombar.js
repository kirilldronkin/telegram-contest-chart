import {noop, createDiv} from '../utils.js';

const {max, round} = Math;

export default class Zoombar {
	constructor(container) {
		this._container = container;
		this._updateListener = noop;

		this._setupDOM();
		this._listenDOMEvents();
	}

	setUpdateListener(listener) {
		this._updateListener = listener;
	}

	setRange(start, end) {
		const containerSize = this._container.offsetWidth;
		const gripsSize = this._leftGrip.offsetWidth + this._rightGrip.offsetWidth;

		this._renderLeftOverlaySize(start);
		this._renderRightOverlaySize(containerSize - end - gripsSize);
		this._renderSelectionSize(end - start - gripsSize);

		this._updateListener();
	}

	getRange() {
		return {
			start: this._leftOverlay.offsetWidth,
			end: this._container.offsetWidth - this._rightOverlay.offsetWidth
		};
	}

	_setupDOM() {
		this._container.classList.add('zoombar');

		this._leftGrip = createDiv('zoombar__grip');
		this._leftOverlay = createDiv('zoombar__overlay');
		this._selection = createDiv('zoombar__selection');
		this._rightGrip = createDiv('zoombar__grip');
		this._rightOverlay = createDiv('zoombar__overlay');

		this._container.appendChild(this._leftOverlay);
		this._container.appendChild(this._leftGrip);
		this._container.appendChild(this._selection);
		this._container.appendChild(this._rightGrip);
		this._container.appendChild(this._rightOverlay);
	}

	_listenDOMEvents() {
		listenHorizontalDragEvent(this._container, this._leftGrip, this._onLeftGripDragged.bind(this));
		listenHorizontalDragEvent(this._container, this._rightGrip, this._onRightGripDragged.bind(this));
		listenHorizontalDragEvent(
			this._container,
			this._selection,
			this._onSelectionDragged.bind(this),
			this._onSelectionDragStarted.bind(this),
			this._onSelectionDragEnded.bind(this)
		);

		this._leftOverlay.addEventListener('click', this._onLeftOverlayClicked.bind(this));
		this._rightOverlay.addEventListener('click', this._onRightOverlayClicked.bind(this));
	}

	_renderSelectionSize(size) {
		const gripsSize = this._leftGrip.offsetWidth + this._rightGrip.offsetWidth;

		this._selection.classList.toggle('_draggable', size < this._container.offsetWidth - gripsSize);
		this._selection.style.width = `${max(size / this._container.offsetWidth * 100, 0)}%`;
	}

	_renderLeftOverlaySize(size) {
		this._leftOverlay.style.width = `${max(size / this._container.offsetWidth * 100, 0)}%`;
	}

	_renderRightOverlaySize(size) {
		this._rightOverlay.style.width = `${max(size / this._container.offsetWidth * 100, 0)}%`;
	}

	_onLeftGripDragged(positionDiff) {
		const newSelectionSize = this._selection.offsetWidth - positionDiff;

		if (newSelectionSize >= 0) {
			this._renderLeftOverlaySize(this._leftOverlay.offsetWidth + positionDiff);
			this._renderSelectionSize(newSelectionSize);

			this._updateListener();
		}
	}

	_onRightGripDragged(positionDiff) {
		const newSelectionSize = this._selection.offsetWidth + positionDiff;

		if (newSelectionSize >= 0) {
			this._renderRightOverlaySize(this._rightOverlay.offsetWidth - positionDiff);
			this._renderSelectionSize(newSelectionSize);

			this._updateListener();
		}
	}

	_onSelectionDragged(positionDiff) {
		let newLeftOverlaySize = this._leftOverlay.offsetWidth + positionDiff;
		let newRightOverlaySize = this._rightOverlay.offsetWidth - positionDiff;

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

	_onSelectionDragStarted() {
		this._selection.classList.add('_dragging');
	}

	_onSelectionDragEnded() {
		this._selection.classList.remove('_dragging');
	}

	_onLeftOverlayClicked(event) {
		const leftOverlayBCR = this._leftOverlay.getBoundingClientRect();

		let newSelectionStart = event.clientX - leftOverlayBCR.left - this._leftGrip.offsetWidth;
		newSelectionStart -= this._selection.offsetWidth / 2;
		newSelectionStart = max(newSelectionStart, 0);

		this._renderLeftOverlaySize(newSelectionStart);
		this._renderRightOverlaySize(this._rightOverlay.offsetWidth + leftOverlayBCR.width - newSelectionStart);

		this._updateListener();
	}

	_onRightOverlayClicked(event) {
		const rightOverlayBCR = this._rightOverlay.getBoundingClientRect();

		let newSelectionEnd = rightOverlayBCR.right - event.clientX - this._rightGrip.offsetWidth;
		newSelectionEnd -= this._selection.offsetWidth / 2;
		newSelectionEnd = max(newSelectionEnd, 0);

		this._renderRightOverlaySize(newSelectionEnd);
		this._renderLeftOverlaySize(this._leftOverlay.offsetWidth + rightOverlayBCR.width - newSelectionEnd);

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
