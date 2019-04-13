import {createDivElement} from '../utils.js';

export default class Toolbar {
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
		while (this._itemsContainer.lastChild) {
			this._itemsContainer.removeChild(this._itemsContainer.lastChild);
		}

		const fragment = document.createDocumentFragment();

		items.forEach(({title, value, color}) => {
			const itemElement = createDivElement('toolbar__item');
			const titleElement = createDivElement('toolbar__item-title', title);
			const valueElement = createDivElement('toolbar__item-value', value);

			valueElement.style.color = color;
			itemElement.appendChild(titleElement);
			itemElement.appendChild(valueElement);

			fragment.appendChild(itemElement);
		});

		this._itemsContainer.appendChild(fragment);
	}

	/**
	 * @private
	 */
	_setupDOM() {
		this._container.classList.add('toolbar');

		this._titleElement = createDivElement('toolbar__title');
		this._itemsContainer = createDivElement('toolbar__items');

		this._container.appendChild(this._titleElement);
		this._container.appendChild(this._itemsContainer);
	}
}
