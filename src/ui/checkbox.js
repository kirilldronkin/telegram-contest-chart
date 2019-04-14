import {noop, createDivElement, isPassiveEventsSupported} from '../utils.js';

/**
 * @const {number}
 */
const LONG_TAP_THRESHOLD = 500;

export default class Checkbox {
	/**
	 * @param {HTMLElement} container
	 * @param {string} text
	 * @param {string} color
	 * @param {boolean=} checked
	 */
	constructor(container, text, color, checked = true) {
		/**
		 * @type {HTMLElement}
		 * @private
		 */
		this._container = container;

		/**
		 * @type {string}
		 * @private
		 */
		this._text = text;

		/**
		 * @type {string}
		 * @private
		 */
		this._color = color;

		/**
		 * @type {boolean}
		 * @private
		 */
		this._checked = checked;

		/**
		 * @type {function()}
		 * @private
		 */
		this._checkedStateChangeListener = noop;

		/**
		 * @type {function()}
		 * @private
		 */
		this._longTapListener = noop;

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._iconElement;

		this._setupDOM();
		this._listenDOMEvents();
		this._renderCheckedState();
	}

	/**
	 * @param {boolean} state
	 */
	setCheckedState(state) {
		this._checked = state;
		this._renderCheckedState();
	}

	/**
	 * @param {function()} listener
	 */
	setCheckedStartChangeListener(listener) {
		this._checkedStateChangeListener = listener;
	}

	/**
	 * @param {function()} listener
	 */
	setLongTapListener(listener) {
		this._longTapListener = listener;
	}

	/**
	 * @return {boolean}
	 */
	isChecked() {
		return this._checked;
	}

	/**
	 * @private
	 */
	_setupDOM() {
		this._container.classList.add('checkbox');

		this._container.style.color = this._color;
		this._container.style.background = this._color;
		this._container.style.borderColor = this._color;

		this._container.appendChild(createDivElement('checkbox__mark'));
		this._container.appendChild(createDivElement('checkbox__text', this._text));
	}

	/**
	 * @private
	 */
	_listenDOMEvents() {
		let tapStartTime;
		let wasTouch;

		const handleTap = () => {
			if (Date.now() - tapStartTime < LONG_TAP_THRESHOLD) {
				this._checked = !this._checked;
				this._renderCheckedState();
				this._checkedStateChangeListener();
			} else {
				this._longTapListener();
			}
		};

		const onMouseDown = () => {
			if (!wasTouch) {
				tapStartTime = Date.now();
			}
		};

		const onMouseUp = () => {
			if (!wasTouch) {
				handleTap();
			}

			wasTouch = false;
		};

		const onTouchStart = () => {
			wasTouch = true;
			tapStartTime = Date.now();
		};

		const onTouchEnd = () => {
			handleTap();
		};

		this._container.addEventListener('mousedown', onMouseDown);
		this._container.addEventListener('touchstart', onTouchStart, isPassiveEventsSupported() && {
			passive: true
		});

		this._container.addEventListener('mouseup', onMouseUp);
		this._container.addEventListener('touchend', onTouchEnd);
	}

	/**
	 * @private
	 */
	_renderCheckedState() {
		this._container.classList.toggle('_checked', this._checked);
		this._container.classList.toggle('_unchecked', !this._checked);
	}
}
