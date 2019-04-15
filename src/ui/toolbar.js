import {createDivElement, formatNumber} from '../utils.js';

const {round} = Math;

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
		this._rowsContainer;

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
	 *   name: string,
	 *   color: string,
	 *   value: number,
	 *   percentage: (number|undefined)
	 * }>} columns
	 */
	setColumns(columns) {
		while (this._rowsContainer.lastChild) {
			this._rowsContainer.removeChild(this._rowsContainer.lastChild);
		}

		const fragment = document.createDocumentFragment();

		columns.forEach(({name, value, color, percentage}) => {
			const rowElement = createDivElement('toolbar__row');
			const nameElement = createDivElement('toolbar__column-name', name);
			const valueElement = createDivElement('toolbar__column-value', formatNumber(round(value)));

			let percentageElement;
			if (typeof percentage !== 'undefined') {
				const percents = `${String(Number(percentage.toFixed(1)))}%`;

				percentageElement = createDivElement('toolbar__column-percentage', percents);
			}

			valueElement.style.color = color;

			if (percentageElement) {
				rowElement.appendChild(percentageElement);
			}

			rowElement.appendChild(nameElement);
			rowElement.appendChild(valueElement);

			fragment.appendChild(rowElement);
		});

		this._rowsContainer.appendChild(fragment);
	}

	/**
	 * @private
	 */
	_setupDOM() {
		this._container.classList.add('toolbar');

		this._titleElement = createDivElement('toolbar__title');
		this._rowsContainer = createDivElement('toolbar__rows');

		this._container.appendChild(this._titleElement);
		this._container.appendChild(this._rowsContainer);
	}
}
