import {noop, createDivElement} from '../utils.js';

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
		this._updateListener = noop;

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
	 * @param {function()} listener
	 */
	setUpdateListener(listener) {
		this._updateListener = listener;
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

		this._iconElement = createDivElement('checkbox__icon');
		this._iconElement.style.borderColor = this._color;
		this._iconElement.appendChild(createDivElement('checkbox__mark'));

		this._container.appendChild(this._iconElement);
		this._container.appendChild(createDivElement('checkbox__text', this._text));
	}

	/**
	 * @private
	 */
	_listenDOMEvents() {
		this._iconElement.addEventListener('click', () => {
			this._checked = !this._checked;

			this._container.classList.add('_animated');
			this._renderCheckedState();

			this._updateListener();
		});
	}

	/**
	 * @private
	 */
	_renderCheckedState() {
		this._container.classList.toggle('_checked', this._checked);
		this._container.classList.toggle('_unchecked', !this._checked);
	}
}
