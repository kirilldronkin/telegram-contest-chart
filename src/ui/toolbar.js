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
		this._columnsContainer;

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
	 *   value: number,
	 *   color: (string|undefined),
	 *   percentage: (number|undefined)
	 * }>} columns
	 */
	setColumns(columns) {
		while (this._columnsContainer.lastChild) {
			this._columnsContainer.removeChild(this._columnsContainer.lastChild);
		}

		const nameColumn = createDivElement('toolbar__column _name');
		const valueColumn = createDivElement('toolbar__column _value');
		const percentageColumn = createDivElement('toolbar__column _percentage');

		columns.forEach(({name, value, color, percentage}) => {
			nameColumn.appendChild(
				createDivElement('toolbar__cell', name)
			);

			const valueElement = createDivElement('toolbar__cell', formatNumber(round(value)));
			valueColumn.appendChild(valueElement);

			if (typeof color !== 'undefined') {
				valueElement.style.color = color;
			}

			if (typeof percentage !== 'undefined') {
				percentageColumn.appendChild(
					createDivElement('toolbar__cell', `${String(Number(percentage.toFixed(1)))}%`)
				);
			}
		});

		const fragment = document.createDocumentFragment();

		if (percentageColumn.firstChild) {
			fragment.appendChild(percentageColumn);
		}

		fragment.appendChild(nameColumn);
		fragment.appendChild(valueColumn);

		this._columnsContainer.appendChild(fragment);
	}

	/**
	 * @private
	 */
	_setupDOM() {
		this._container.classList.add('toolbar');

		this._titleElement = createDivElement('toolbar__title');
		this._columnsContainer = createDivElement('toolbar__columns');

		this._container.appendChild(this._titleElement);
		this._container.appendChild(this._columnsContainer);
	}
}
