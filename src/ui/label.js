import {createDiv} from '../utils.js';

export default class Label {
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
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._titleElement;

		/**
		 * @type {HTMLDivElement}
		 * @private
		 */
		this._itemsContainer;

		this._setupDOM();
	}

	/**
	 * @param {string} title
	 */
	setTitle(title) {
		this._titleElement.textContent = title;
	}

	/**
	 * @param {Array<{
	 *   title: string,
	 *   value: string,
	 *   color: string
	 * }>} items
	 */
	setItems(items) {
		while (this._itemsContainer.firstChild) {
			this._itemsContainer.removeChild(this._itemsContainer.firstChild);
		}

		items.forEach(({title, value, color}) => {
			const itemElement = createDiv('label__item');
			const valueElement = createDiv('label__item-value', value);
			const titleElement = createDiv('label__item-title', title);

			itemElement.style.color = color;
			itemElement.appendChild(valueElement);
			itemElement.appendChild(titleElement);

			this._itemsContainer.appendChild(itemElement);
		});
	}

	/**
	 * @private
	 */
	_setupDOM() {
		this._container.classList.add('label');

		this._titleElement = createDiv('label__title');
		this._itemsContainer = createDiv('label__items');

		this._container.appendChild(this._titleElement);
		this._container.appendChild(this._itemsContainer);
	}
}
